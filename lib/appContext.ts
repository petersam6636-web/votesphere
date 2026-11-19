import {createContext}  from 'react';

type Context = null | {
userInfo: string, 
setUserInfo: (value: string) => void
}

export  const appContext = createContext<Context>(null)