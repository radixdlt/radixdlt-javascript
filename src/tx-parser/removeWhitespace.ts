/// Removes LEADING tabs only
// export const trimWS = (str: string): string => str.replace(`/^\t+/gm`, '')

export const noTab = (str: string): string => str.replace(`/\t/g`, '')
