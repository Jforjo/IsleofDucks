export async function getUUID(username) {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
        mode: 'no-cors'
    });
    if (!res.ok) {
        console.log("hypixelUtils.js - getUUID: " + res);
        return {
            success: false,
            message: 'Bad response from Mojang (UUID)'
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
    const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, {
        mode: 'no-cors',
        method: 'GET'
    });
    if (!res.ok) {
        const data = await res.json();
        console.log("hypixelUtils.js - getUsername: " + JSON.stringify(data));
        return {
            success: false,
            message: 'Bad response from Mojang (Username)\n' + uuid + '\n' + JSON.stringify(data)
        };
    }
    const data = await res.json();
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