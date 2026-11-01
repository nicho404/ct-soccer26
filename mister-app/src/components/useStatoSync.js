import { useSyncExternalStore } from 'react'
import { leggiStatoSync, iscriviSync } from '../db/sync'

export const useStatoSync = () => useSyncExternalStore(iscriviSync, leggiStatoSync)
