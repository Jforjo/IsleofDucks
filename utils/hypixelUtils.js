export async function getUUID(username) {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
        mode: 'no-cors'
    });
    const data = await res.json();
    if (!res.ok) {
        return {
            success: false,
            message: 'Bad response from Mojang'
        };
    }
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
    const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${encodeURIComponent(username)}`, {
        mode: 'no-cors'
    });
    const data = await res.json();
    if (!res.ok) {
        return {
            success: false,
            message: 'Bad response from Mojang'
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