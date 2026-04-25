const logos = {
    spotify: "https://cdn.discordapp.com/attachments/915960742740639843/1455315415575036089/Spotify_Primary_Logo_RGB_Green.png?ex=69544799&is=6952f619&hm=34c7e06f9e29d112cec61693ba01d4aab1407a5e4e6d5f963575ae3398a095fe&",
    youtube: "https://cdn.discordapp.com/attachments/915960742740639843/1455315415189291311/Youtube_logo.png?ex=69544799&is=6952f619&hm=f64b49bc16789fba0e87c17e6bfeb124b955c1acca5961f1042b6e13b31313cc&",
    soundcloud: "https://cdn.discordapp.com/attachments/915960742740639843/1455315414858076444/SoundCloud_Logo_rounded.png?ex=69544799&is=6952f619&hm=ce3ee21065a2f5dc24ec77adf68dc662ed722e423d27fd90b0b877c6d8760945&",
};

export function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export function getLogo(input) {
    if (input === 1 || input === '1') return logos.spotify;
    if (input === 2 || input === '2') return logos.youtube;
    if (input === 3 || input === '3') return logos.soundcloud;

    const key = String(input).toLowerCase();
    return logos[key] || logos.youtube;
}