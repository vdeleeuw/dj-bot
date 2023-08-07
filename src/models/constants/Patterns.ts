// url
export const urlPattern =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi

// youtube
export const youtubeVideoPattern = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi
export const youtubePlaylistPattern = /^.*(list=)([^#\&\?]*).*/gi

// spotify
export const spotifySongPattern = /^(https:\/\/open\.spotify\.com\/.*\/track\/)([^#\&\?]*).*/gi
export const spotifyPlaylistPattern = /^(https:\/\/open\.spotify\.com\/playlist\/)([^#\&\?]*).*/gi
