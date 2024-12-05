import Loading from '@/components/ui/loading'
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import React from 'react'

export default function Page(): React.JSX.Element {
    return (
        <>
            <AuthenticateWithRedirectCallback />
            <Loading />
        </>
    )
}