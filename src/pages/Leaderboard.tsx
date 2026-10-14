import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Award01FreeIcons } from '@hugeicons/core-free-icons'
import { Tabs } from '../components/globals/Tabs'
import { Button } from '../components/globals/Button'
import BoardProfileCard from '../components/points/BoardProfileCard'
import {
  useLeaderboard,
  useLeaderboardProfile,
} from '../data_layer/points'
import { useAppSelector } from '../utils/hooks'
import useAuthNavigate from '../hooks/useAuthNavigate'
import { boardResetLabel, formatPoints } from '../utils/points'
import type {
  LeaderboardPeriod,
  LeaderboardResponse,
  LeaderboardRow,
} from '../types/points.types'

const PAGE_SIZE = 25

const rankBadge = (rank: number) => {
  if (rank === 1) return 'bg-brand-green text-black dark:text-[#000000]'
  if (rank === 2) return 'bg-neutral-10/30 text-black'
  if (rank === 3) return 'bg-warning/30 text-warning'
  return 'bg-hover text-neutral-10'
}

const Header = () => (
  <div className='flex flex-col gap-2'>
    <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
      Leaderboard
    </h1>
    <p className='text-sm text-neutral-10'>
      Ranked by points earned this week or this month. Shown by handle only.
    </p>
  </div>
)

const SignedOut = () => {
  const authNavigate = useAuthNavigate()
  return (
    <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center'>
      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-hover text-neutral-10'>
        <HugeiconsIcon icon={Award01FreeIcons} size={22} />
      </div>
      <span className='text-base font-bold text-black'>
        Sign in to see the boards
      </span>
      <span className='text-sm text-neutral-10'>
        Weekly and monthly boards are open to signed-in players.
      </span>
      <Button
        type='button'
        text='Sign in'
        className='w-fit!'
        variation='primary'
        onClick={() => authNavigate('/signin')}
      />
    </div>
  )
}

const Row = ({ row, isMe }: { row: LeaderboardRow; isMe: boolean }) => (
  <div
    className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5 ${
      isMe ? 'bg-hover' : ''
    }`}
  >
    <span
      className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-bold ${rankBadge(
        row.rank,
      )}`}
    >
      {row.rank}
    </span>
    <span className='truncate text-sm font-semibold text-black'>
      @{row.handle}
      {isMe && <span className='ml-2 text-xs font-medium text-neutral-10'>You</span>}
    </span>
    <span className='text-right text-sm font-bold text-black'>
      {formatPoints(row.points)} pts
    </span>
  </div>
)

const MyPlace = ({
  board,
  optedIn,
}: {
  board?: LeaderboardResponse
  optedIn: boolean
}) => {
  if (!board) return null
  const span = board.period === 'weekly' ? 'this week' : 'this month'

  if (board.me) {
    return (
      <div className='flex items-center justify-between gap-3 rounded-2xl bg-brand-green p-4 text-black dark:text-[#000000]'>
        <div className='flex flex-col'>
          <span className='text-xs font-medium opacity-80'>Your place</span>
          <span className='text-2xl font-bold'>#{board.me.rank}</span>
        </div>
        <div className='flex flex-col text-right'>
          <span className='text-xs font-medium opacity-80'>@{board.me.handle}</span>
          <span className='text-lg font-bold'>
            {formatPoints(board.me.points)} pts
          </span>
        </div>
      </div>
    )
  }

  return (
    <p className='rounded-2xl border border-border bg-card p-4 text-sm text-neutral-10'>
      {optedIn
        ? `Earn points ${span} to appear on this board.`
        : 'Join the board below to appear on it.'}
    </p>
  )
}

const Board = () => {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly')
  const [page, setPage] = useState(0)
  const { data: profile } = useLeaderboardProfile()
  const { data, isLoading, isError, isFetching, refetch } = useLeaderboard(
    period,
    PAGE_SIZE,
    page * PAGE_SIZE,
  )

  // placeholderData keeps the previous period visible while switching; only
  // trust it once it's the period we asked for.
  const board = data?.period === period ? data : undefined
  const totalPages = board ? Math.max(1, Math.ceil(board.total / PAGE_SIZE)) : 1

  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Tabs
          tabs={[
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
          ]}
          activeTab={period}
          onChange={(id) => {
            setPeriod(id as LeaderboardPeriod)
            setPage(0)
          }}
          className='w-fit!'
        />
        {board && (
          <span className='text-xs font-semibold text-neutral-10'>
            {boardResetLabel(board.to, board.period)}
          </span>
        )}
      </div>

      <MyPlace board={board} optedIn={!!profile?.optedIn} />

      <div className='rounded-2xl border border-border bg-card'>
        <div className='grid grid-cols-[auto_1fr_auto] gap-3 border-b border-border px-4 py-3 text-xs font-semibold text-neutral-10'>
          <span className='min-w-7'>#</span>
          <span>Player</span>
          <span className='text-right'>Points</span>
        </div>

        {isLoading || (!board && isFetching) ? (
          <div className='flex flex-col gap-2 p-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='h-10 animate-pulse rounded-lg bg-hover' />
            ))}
          </div>
        ) : isError || !board ? (
          <div className='flex flex-col items-center gap-3 p-6 text-center'>
            <p className='text-sm text-neutral-10'>
              We couldn’t load the board right now.
            </p>
            <Button
              type='button'
              text='Try again'
              className='w-fit!'
              variation='plain'
              onClick={() => refetch()}
            />
          </div>
        ) : board.data.length === 0 ? (
          <p className='p-6 text-center text-sm text-neutral-10'>
            No one’s on this board yet. Points earned{' '}
            {period === 'weekly' ? 'this week' : 'this month'} by players who
            have joined will show here.
          </p>
        ) : (
          <div className={`divide-y divide-border ${isFetching ? 'opacity-60' : ''}`}>
            {board.data.map((row) => (
              <Row
                key={`${row.rank}-${row.handle}`}
                row={row}
                isMe={!!board.me && board.me.handle === row.handle}
              />
            ))}
          </div>
        )}
      </div>

      {board && board.total > PAGE_SIZE && (
        <div className='flex items-center justify-between gap-3'>
          <Button
            type='button'
            text='Previous'
            className='w-fit!'
            variation='plain'
            disabled={page === 0 || isFetching}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          />
          <span className='text-xs text-neutral-10'>
            Page {page + 1} of {totalPages}
          </span>
          <Button
            type='button'
            text='Next'
            className='w-fit!'
            variation='plain'
            disabled={page + 1 >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
          />
        </div>
      )}

      <BoardProfileCard />
    </>
  )
}

const Leaderboard = () => {
  const signedIn = useAppSelector((state) => !!state.user.user)

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <Header />
      {signedIn ? <Board /> : <SignedOut />}
    </main>
  )
}

export default Leaderboard
