"use client";

import * as React from "react";
import { type OAuthStrategy } from "@clerk/types";
import {
    SignedIn,
    SignedOut,
    UserButton,
    useSignIn,
    useSignUp,
} from "@clerk/nextjs";
import { DiscordIcon } from "./icons";

export default function DiscordLogin() {
    const { signIn } = useSignIn();
    const { signUp, setActive } = useSignUp();
    if (!signIn || !signUp) return null;

    const signInWith = (strategy: OAuthStrategy) => {
        return signIn.authenticateWithRedirect({
            strategy,
            redirectUrl: `/sso-callback`,
            redirectUrlComplete: `/`,
        });
    };

    async function handleSignIn(strategy: OAuthStrategy) {
        if (!signIn || !signUp) return null;

        const userExistsButNeedsToSignIn =
            signUp.verifications.externalAccount.status === "transferable" &&
            signUp.verifications.externalAccount.error?.code ===
                "external_account_exists";

        if (userExistsButNeedsToSignIn) {
            const res = await signIn.create({ transfer: true });

            if (res.status === "complete") {
                void setActive({
                    session: res.createdSessionId,
                });
            }
        }

        const userNeedsToBeCreated =
            signIn.firstFactorVerification.status === "transferable";

        if (userNeedsToBeCreated) {
            const res = await signUp.create({
                transfer: true,
            });

            if (res.status === "complete") {
                void setActive({
                    session: res.createdSessionId,
                });
            }
        } else {
            void signInWith(strategy);
        }
    }

    return (
        <>
            <SignedOut>
                <button
                    className="flex h-10 min-w-12 items-center justify-center gap-1 rounded-md font-bold text-lg bg-blurple-500 py-1 px-2 text-gray-200 hover:bg-blurple-600 hover:text-gray-100 dark:bg-blurple-600 dark:text-gray-200 hover:dark:bg-blurple-700 dark:hover:text-gray-100"
                    onClick={() => {
                        void handleSignIn("oauth_discord");
                    }}
                    aria-label="Login with Discord"
                >
                    <DiscordIcon className="h-6 w-6 text-inherit" />
                    <span>LOGIN</span>
                </button>
            </SignedOut>
            <SignedIn>
                <UserButton />
            </SignedIn>
        </>
    );
}
