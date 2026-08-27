export type TabItem = {
  id: string
  label: string
}

type TabsProps = {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export const Tabs = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}: TabsProps) => (
  <div
    className={`inline-flex items-center gap-1 rounded-full bg-hover p-1 ${className}`}
  >
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type='button'
        onClick={() => onChange(tab.id)}
        className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
          activeTab === tab.id
            ? 'bg-text-black text-white dark:text-neutral-10'
            : 'text-placeholder'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
)
