export const createSessionId = () => `session-${Date.now()}`

export const formatDate = (value: Date | string) => new Date(value).toLocaleString()
