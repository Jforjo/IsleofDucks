import { currentUser } from '@clerk/nextjs/server'

export default async function Home() {
    const user = await currentUser();
    if (!user) return <div>Not signed in</div>
    return (
        <>
            <section className="mt-8">
                { JSON.stringify(user.externalAccounts[0].externalId) }
            </section>
        </>
    );
}
