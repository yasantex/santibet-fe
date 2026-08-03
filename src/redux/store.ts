import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import userSlice from './userSlice'
const storage = {
  getItem(key: string) {
    return Promise.resolve(window.localStorage.getItem(key))
  },
  setItem(key: string, value: string) {
    return Promise.resolve(window.localStorage.setItem(key, value))
  },
  removeItem(key: string) {
    return Promise.resolve(window.localStorage.removeItem(key))
  },
}

const persistConfig = {
  key: 'root', // key is required
  storage, // storage engine
  // You can also specify which reducers to persist:
  // whitelist: ['user'] // only user reducer will be persisted
  //   blacklist: ['betting'], // betting will not be persisted
}

const rootReducer = combineReducers({
  user: userSlice,

  // other reducers would go here
})

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
