import type { Staff } from './types';

/**
 * Mock Staff Data for Phase 1 (Local Static Build)
 * 
 * These mock objects simulate the data schema returned by the API
 * while referencing local files inside public/home_files/ to display
 * the exact models from the original home.html page.
 */
export const mockStaffList: Staff[] = [
  {
    id: 1,
    name: "Layla",
    description: "Vibrant and elegant, offering top-tier companionship with verified reviews. Passionate about arts and fine dining.",
    phone: "+66 81-234-5678",
    price: 150.00,
    photoUrl: "/home_files/layla-17597919156890.jpg",
    isActive: true,
    createdAt: "2026-06-20T22:16"
  },
  {
    id: 2,
    name: "Emma",
    description: "Warm-hearted professional companion. Enjoys travel, high fashion, and meaningful conversations.",
    phone: "+66 82-345-6789",
    price: 180.00,
    photoUrl: "/home_files/emma-17146635516789.jpg",
    isActive: true,
    createdAt: "2026-06-21T10:30"
  },
  {
    id: 3,
    name: "Hikari Narimiya",
    description: "Charming, elegant, and polite companion from Tokyo, currently open for premium dates. High rating and fully verified.",
    phone: "+81 90-1234-5678",
    price: 200.00,
    photoUrl: "/home_files/hikari-narimiya-17370565173022.jpg",
    isActive: true,
    createdAt: "2026-06-22T14:15"
  },
  {
    id: 4,
    name: "Lana",
    description: "Experienced runway model, friendly and outgoing. Perfect date companion for exclusive social events and dinners.",
    phone: "+971 50-123-4567",
    price: 160.00,
    photoUrl: "/home_files/lana-17712715096808.jpg",
    isActive: true,
    createdAt: "2026-06-23T18:40"
  },
  {
    id: 5,
    name: "Joyzkie",
    description: "Cheerful and sweet personality. Enjoys dancing, outdoor activities, and meeting new people.",
    phone: "+63 917-123-4567",
    price: 120.00,
    photoUrl: "/home_files/joyzkie-17782618698872.jpg",
    isActive: true,
    createdAt: "2026-06-24T09:00"
  },
  {
    id: 6,
    name: "Alisa",
    description: "Stunning and discrete companion. Highly focused on privacy, premium quality services, and verified experiences.",
    phone: "+48 501-234-567",
    price: 220.00,
    photoUrl: "/home_files/alisa-17651529992565.jpg",
    isActive: true,
    createdAt: "2026-06-24T12:00"
  },
  {
    id: 7,
    name: "Miki Yamamoto",
    description: "Sophisticated, bilingual companion who loves literature, classical music, and fine dining. Guaranteed pleasant company.",
    phone: "+81 80-9876-5432",
    price: 250.00,
    photoUrl: "/home_files/miki-yamamoto-17027011041219.jpg",
    isActive: true,
    createdAt: "2026-06-25T11:20"
  },
  {
    id: 8,
    name: "Mifuyu Sakurai",
    description: "Very polite, gentle, and sweet-natured. Enjoys cozy conversations and relaxed dining experiences. Rated 5 stars by all guests.",
    phone: "+81 70-1111-2222",
    price: 210.00,
    photoUrl: "/home_files/mifuyu-sakurai-17110887616588.jpg",
    isActive: true,
    createdAt: "2026-06-25T14:10"
  }
];

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
