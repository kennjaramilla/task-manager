import { useStore as baseUseStore } from 'vuex'
import { key, type RootState } from '@/store'

// Define a typed version of useStore
export function useStore() {
  return baseUseStore<RootState>(key)
}