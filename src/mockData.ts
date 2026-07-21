import type { Staff } from './types';

/**
 * Mock Staff Data for Phase 1 (Local Static Build)
 * 
 * These mock objects simulate the data schema returned by the API
 * while referencing local files inside public/home_files/ to display
 * the exact models from the original home.html page.
 */
export interface MockStaffSearchMeta {
  city: string;
  gender: 'Female' | 'Male';
  modes: Array<'On-call' | 'In-call'>;
}

interface MockProfile extends MockStaffSearchMeta {
  id: number;
  name: string;
  photoUrl: string;
  price: number;
}

const mockProfiles: MockProfile[] = [
  { id: 1, name: 'Layla', photoUrl: '/home_files/layla-17597919156890.jpg', price: 150, city: 'Bangkok', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 2, name: 'Emma', photoUrl: '/home_files/emma-17146635516789.jpg', price: 180, city: 'London', gender: 'Female', modes: ['On-call'] },
  { id: 3, name: 'Hikari Narimiya', photoUrl: '/home_files/hikari-narimiya-17370565173022.jpg', price: 200, city: 'Tokyo', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 4, name: 'Lana', photoUrl: '/home_files/lana-17712715096808.jpg', price: 160, city: 'Dubai', gender: 'Female', modes: ['In-call'] },
  { id: 5, name: 'Joyzkie', photoUrl: '/home_files/joyzkie-17782618698872.jpg', price: 120, city: 'Manila', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 6, name: 'Alisa', photoUrl: '/home_files/alisa-17651529992565.jpg', price: 220, city: 'Paris', gender: 'Female', modes: ['On-call'] },
  { id: 7, name: 'Miki Yamamoto', photoUrl: '/home_files/miki-yamamoto-17027011041219.jpg', price: 250, city: 'Tokyo', gender: 'Male', modes: ['On-call', 'In-call'] },
  { id: 8, name: 'Mifuyu Sakurai', photoUrl: '/home_files/mifuyu-sakurai-17110887616588.jpg', price: 210, city: 'Singapore', gender: 'Female', modes: ['In-call'] },
  { id: 9, name: 'Agnes', photoUrl: '/home_files/agnes-15607176862448.jpg', price: 140, city: 'Bangkok', gender: 'Female', modes: ['On-call'] },
  { id: 10, name: 'Alicea', photoUrl: '/home_files/alicea-15647362646872.jpg', price: 170, city: 'Bangkok', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 11, name: 'Andreana', photoUrl: '/home_files/andreana-17822591262779.jpg', price: 190, city: 'Bangkok', gender: 'Female', modes: ['In-call'] },
  { id: 12, name: 'Anna Baby', photoUrl: '/home_files/anna-baby-17154305866564.jpg', price: 155, city: 'Bangkok', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 13, name: 'Apple', photoUrl: '/home_files/apple-15623100050666.jpg', price: 135, city: 'Manila', gender: 'Female', modes: ['On-call'] },
  { id: 14, name: 'Audrey', photoUrl: '/home_files/audrey-16348721686877.jpg', price: 175, city: 'Singapore', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 15, name: 'Ava', photoUrl: '/home_files/ava-17648689007974.jpg', price: 230, city: 'London', gender: 'Female', modes: ['In-call'] },
  { id: 16, name: 'Azelea', photoUrl: '/home_files/azelea-17076015277979.jpg', price: 205, city: 'Paris', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 17, name: 'Bailey', photoUrl: '/home_files/bailey-17820705947642.jpg', price: 185, city: 'Barcelona', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 18, name: 'Chloe', photoUrl: '/home_files/chloe-16677107958549.jpg', price: 195, city: 'Berlin', gender: 'Female', modes: ['In-call'] },
  { id: 19, name: 'Imakadileane', photoUrl: '/home_files/imakadileane-17822611970519.jpg', price: 215, city: 'Los Angeles', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 20, name: 'Kara', photoUrl: '/home_files/kara-15689781784653.jpg', price: 165, city: 'Miami', gender: 'Female', modes: ['On-call'] },
  { id: 21, name: 'Kim', photoUrl: '/home_files/kim10-17430657439902.jpg', price: 180, city: 'Toronto', gender: 'Male', modes: ['In-call'] },
  { id: 22, name: 'Kinky C', photoUrl: '/home_files/kinkyc-17325481900739.jpg', price: 225, city: 'New York', gender: 'Male', modes: ['On-call', 'In-call'] },
  { id: 23, name: 'Laur', photoUrl: '/home_files/laur-17821753065275.jpg', price: 200, city: 'Doha', gender: 'Female', modes: ['In-call'] },
  { id: 24, name: 'Lea', photoUrl: '/home_files/lea-17808353316786.jpg', price: 190, city: 'Abu Dhabi', gender: 'Female', modes: ['On-call'] },
  { id: 25, name: 'Lia', photoUrl: '/home_files/lia-16733403994723.jpg', price: 175, city: 'Istanbul', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 26, name: 'Mae', photoUrl: '/home_files/mae-17808283159589.jpg', price: 185, city: 'Dubai', gender: 'Female', modes: ['On-call'] },
  { id: 27, name: 'Maria', photoUrl: '/home_files/maria-17669846974490.jpg', price: 210, city: 'London', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 28, name: 'Mazzy', photoUrl: '/home_files/mazzy-17817648368181.jpg', price: 175, city: 'Singapore', gender: 'Male', modes: ['On-call'] },
  { id: 29, name: 'Melek', photoUrl: '/home_files/melek-16620653348544.jpg', price: 160, city: 'Berlin', gender: 'Female', modes: ['On-call'] },
  { id: 30, name: 'Miho', photoUrl: '/home_files/miho-15854610612652.jpg', price: 215, city: 'Tokyo', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 31, name: 'Misaki', photoUrl: '/home_files/misaki-17012656183467.jpg', price: 205, city: 'Tokyo', gender: 'Male', modes: ['On-call'] },
  { id: 32, name: 'Nana', photoUrl: '/home_files/nana-15575619024446.jpg', price: 145, city: 'Manila', gender: 'Female', modes: ['In-call'] },
  { id: 33, name: 'Nina', photoUrl: '/home_files/nina-15609673418083.jpg', price: 170, city: 'Bangkok', gender: 'Female', modes: ['On-call'] },
  { id: 34, name: 'Pinky', photoUrl: '/home_files/pinky-15632672706394.jpg', price: 155, city: 'Manila', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 35, name: 'Ran NY', photoUrl: '/home_files/ran-ny-15797810551971.jpg', price: 220, city: 'New York', gender: 'Female', modes: ['On-call'] },
  { id: 36, name: 'Rio Nanase', photoUrl: '/home_files/rio-nanase-17229186235364.jpg', price: 225, city: 'Singapore', gender: 'Female', modes: ['On-call', 'In-call'] },
  { id: 37, name: 'Rose', photoUrl: '/home_files/rose-in-thailand-16503764477841.jpg', price: 165, city: 'Bangkok', gender: 'Female', modes: ['In-call'] },
  { id: 38, name: 'Smile', photoUrl: '/home_files/smile-15606356507970.jpg', price: 180, city: 'Paris', gender: 'Female', modes: ['On-call'] },
  { id: 39, name: 'Soda', photoUrl: '/home_files/soda69-17797045674749.jpg', price: 195, city: 'Barcelona', gender: 'Male', modes: ['On-call', 'In-call'] }
];

export const mockStaffSearchMeta: Record<number, MockStaffSearchMeta> = mockProfiles.reduce((result, profile) => {
  result[profile.id] = { city: profile.city, gender: profile.gender, modes: profile.modes };
  return result;
}, {} as Record<number, MockStaffSearchMeta>);

const mockBodyTypes = ['Petite', 'Slim', 'Athletic', 'Curvy'];

export const mockStaffList: Staff[] = mockProfiles.map((profile, index) => ({
  id: profile.id,
  name: profile.name,
  description: `Available in ${profile.city} for discreet, premium companionship.`,
  phone: `+1 555 010${String(profile.id).padStart(2, '0')}`,
  price: profile.price,
  photoUrl: profile.photoUrl,
  photoUrls: [profile.photoUrl],
  isActive: true,
  createdAt: `2026-06-${String((profile.id % 28) + 1).padStart(2, '0')}T12:00`,
  city: profile.city,
  location: profile.city,
  age: 23 + (profile.id % 8),
  rating: Number((4.6 + (profile.id % 5) / 10).toFixed(1)),
  height: 158 + (profile.id % 15),
  bodyType: mockBodyTypes[profile.id % mockBodyTypes.length],
  size: profile.id % 3 === 0 ? '80-60-90' : undefined,
  preferences: profile.id % 4 === 0 ? 'Fitness, music' : undefined,
  reviewCount: 12 + profile.id * 3,
  languages: profile.gender === 'Male' ? ['English', 'Thai'] : ['English', 'Thai'],
  verified: index % 5 !== 0,
  responseMinutes: 3 + (profile.id % 6),
}));

/**
 * Mock Live Activity items to simulate Smooci live activity feed
 * 
 * 模拟实时动态流列表，包含头像路径、动态描述、时间戳
 */
export const mockActivities = [
  {
    id: 1,
    name: "Imakadileane",
    action: "just joined Smooci and went online for the first time.",
    image: "/home_files/imakadileane-17822611970519.jpg",
    time: "13 hours ago",
    details: ""
  },
  {
    id: 2,
    name: "Andreana",
    action: "just posted on her timeline.",
    image: "/home_files/andreana-17822591262779.jpg",
    time: "14 hours ago",
    timelineImage: "/home_files/andreana-17822594432826.jpg",
    details: "Free now to meet 💐🌹💯❤️"
  },
  {
    id: 3,
    name: "mae",
    action: "just posted on her timeline.",
    image: "/home_files/mae-17808283159589.jpg",
    time: "1 day ago",
    timelineImage: "/home_files/mae-17821925043330.jpg",
    details: "Available 24/7"
  },
  {
    id: 4,
    name: "Bailey",
    action: "just posted on her timeline.",
    image: "/home_files/bailey-17820705947642.jpg",
    time: "1 day ago",
    timelineImage: "/home_files/bailey-17821383254401.jpg",
    details: "Come get me 👅"
  }
];
