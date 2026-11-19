import { ReactNode } from "react";
import { appContext } from "./appContext";
import { useState } from "react";
export default function ContextFile ({children}: {children: ReactNode}){
    const [userInfo, setUserInfo] = useState<string>('')
    return <appContext.Provider value={{userInfo, setUserInfo}}>
        {children}
    </appContext.Provider>
}