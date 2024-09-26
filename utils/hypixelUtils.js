export async function getUUID(username) {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
        mode: 'no-cors'
    });
    if (!res.ok) {
        console.log("hypixelUtils.js - getUUID: " + res);
        return {
            success: false,
            message: 'Bad response from Mojang (UUID)\n' + res.json()
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
export async function getUsername(uuid) {
    const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${encodeURIComponent(uuid)}`, {
        mode: 'no-cors'
    });
    if (!res.ok) {
        console.log("hypixelUtils.js - getUsername: " + res);
        const data = await res.json();
        return {
            success: false,
            message: 'Bad response from Mojang (Username)\n' + uuid + '\n' + data
        };
    }
    if (data.id === null) return {
        success: false,
        message: data?.errorMessage ? data.errorMessage : 'UUID not found'
    }
    return {
        success: true,
        uuid: data.id,
        name: data.name
    };
}