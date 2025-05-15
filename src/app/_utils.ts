export function RolesCompare(roles1: string[] | Set<string>, roles2: string[] | Set<string>): string[] {
    return Array.from(roles1).filter(role => Array.from(roles2).includes(role));
}