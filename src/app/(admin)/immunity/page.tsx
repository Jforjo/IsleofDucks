import { getImmunePlayers } from "@/discord/utils";
import React from "react";

export default async function Immunity() {
    const immune = await getImmunePlayers();
    const sortedImmune = Object.entries(immune.players.reduce<{ [key: string]: { uuid: string, name?: string, discord: string | null, reason: string }[] }>((accumlator: { [key: string]: { uuid: string, name?: string, discord: string | null, reason: string }[] }, current: { uuid: string, name?: string, discord: string | null, reason: string }) => {
        (accumlator[current.reason] = accumlator[current.reason] || []).push(current);
        return accumlator;
    }, {}));
    return (
        <section className="m-4 p-2">
            <h2 className="text-2xl mb-2">Immune Players</h2>
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Discord</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {immune.players.map((player) => (
                        <tr key={player.uuid}>
                            <td>{player.name}</td>
                            <td>{player.discord}</td>
                            <td>{player.reason}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}