import { DEFAULT_USERS } from './constants'

export const getUsers       = () => { try { return JSON.parse(localStorage.getItem('fyp_users')) || DEFAULT_USERS } catch { return DEFAULT_USERS } }
export const saveUsers      = (u) => localStorage.setItem('fyp_users', JSON.stringify(u))
export const getSession     = () => { try { return JSON.parse(sessionStorage.getItem('fyp_session')) } catch { return null } }
export const saveSession    = (u) => sessionStorage.setItem('fyp_session', JSON.stringify(u))
export const clearSession   = () => sessionStorage.removeItem('fyp_session')
export const getSheetUrl    = () => localStorage.getItem('fyp_sheet_url') || ''
export const saveSheetUrl   = (url) => localStorage.setItem('fyp_sheet_url', url)
export const getExtraModels = () => { try { return JSON.parse(localStorage.getItem('fyp_extra_models')) || [] } catch { return [] } }
export const saveExtraModels= (m) => localStorage.setItem('fyp_extra_models', JSON.stringify(m))
