import youtubeIcon from '../assets/youtube.png';
import instagramIcon from '../assets/instagram.png';
import tiktokIcon from '../assets/tiktok.png';
import facebookIcon from '../assets/facebook.png';
import whatsappIcon from '../assets/whatsapp.png';
import telegramIcon from '../assets/telegram.png';
import twitchIcon from '../assets/twitch.png';
import discordIcon from '../assets/dicord.png';
import xIcon from '../assets/x.png';
import redditIcon from '../assets/reddit.png';
import linkedinIcon from '../assets/linkedin.png';
import quoraIcon from '../assets/quora.png';
import tumblrIcon from '../assets/tumblr.png';
import pinterestIcon from '../assets/pinterest.png';
import snapchatIcon from '../assets/snapchat.png';
import githubIcon from '../assets/github.png';

export const getSocialIcon = (platform: string): string => {
  const p = platform.toLowerCase();
  switch (p) {
    case 'youtube': return youtubeIcon;
    case 'instagram': return instagramIcon;
    case 'tiktok': return tiktokIcon;
    case 'facebook': return facebookIcon;
    case 'whatsapp': return whatsappIcon;
    case 'telegram': return telegramIcon;
    case 'twitch': return twitchIcon;
    case 'discord': return discordIcon;
    case 'x': return xIcon;
    case 'twitter': return xIcon;
    case 'reddit': return redditIcon;
    case 'linkedin': return linkedinIcon;
    case 'quora': return quoraIcon;
    case 'tumblr': return tumblrIcon;
    case 'pinterest': return pinterestIcon;
    case 'snapchat': return snapchatIcon;
    case 'github': return githubIcon;
    default: return '';
  }
};

export const fetchFollowersCount = async (platform: string, username: string): Promise<number> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (!username) return 0;
  
  // Create a pseudo-random count based on the username to make it feel slightly consistent
  // In a real scenario, this would be an API call to YouTube Data API or Instagram Scraper
  let seed = 0;
  for (let i = 0; i < username.length; i++) {
    seed += username.charCodeAt(i);
  }
  
  const platformMultiplier = platform.toLowerCase() === 'youtube' ? 1.5 : 1.2;
  
  // Generate a somewhat random but high number, e.g., between 5k and 2.5M
  const randomFactor = Math.floor(Math.random() * 50000) + 5000;
  
  let count = Math.floor((seed * 1000 + randomFactor) * platformMultiplier);
  
  // Cap at a reasonable max for mock data (2.5 million)
  if (count > 2500000) count = 2500000;
  
  return count;
};
