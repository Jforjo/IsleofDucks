export async function getUUID(username) {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
        mode: 'no-cors'
    });
    if (!res.ok) {
        return {
            success: false,
            message: 'Bad response from Mojang'
        };
    }
    const data = await res.json();
    if (data.id === null) return {
        success: false,
        message: data?.errorMessage ? data.errorMessage : 'Username not found'
    }
    return {
        success: true,
        uuid: data.id,
        name: data.name
    };
}
// export async function getUsername(uuid) {
//     const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, {
//         mode: 'no-cors',
//         method: 'GET'
//     });
//     if (!res.ok) {
//         const data = await res.json();
//         console.log("hypixelUtils.js - getUsername: " + JSON.stringify(data));
//         return {
//             success: false,
//             message: 'Bad response from Mojang (Username)\n' + uuid + '\n' + JSON.stringify(data)
//         };
//     }
//     const data = await res.json();
//     if (data.id === null) return {
//         success: false,
//         message: data?.errorMessage ? data.errorMessage : 'UUID not found'
//     }
//     return {
//         success: true,
//         uuid: data.id,
//         name: data.name
//     };
// }
export async function getUsername(uuid) {
    const res = await fetch(`https://api.minetools.eu/uuid/${encodeURIComponent(uuid)}`, {
        mode: 'no-cors'
    });
    if (!res.ok) {
        return {
            success: false,
            message: 'Bad response from Minetools'
        };
    }
    const data = await res.json();
    if (data.id === null) return {
        success: false,
        message: data?.error ? data.error : 'UUID not found'
    }
    return {
        success: true,
        uuid: data.id,
        name: data.name
    };
}

export async function getImmunePlayers() {
    const res = await fetch('https://isle-of-ducks.vercel.app/api/immune');
    const data = await res.json();
    if (!res.ok) {
        return {
            success: false,
            message: 'Bad response',
            ping: false
        };
    }
    // const data = await get('immune');
    const players = [];
    await Promise.all(data.map(async id => {
        const username = await getUsername(id);
        if (username.success) {
            players.push({
                id: id, name: username.name
            });
        }
    }));
    return {
        success: true,
        players: players
    };
}