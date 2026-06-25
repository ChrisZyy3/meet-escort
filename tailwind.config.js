/** 
 * Tailwind CSS Configuration File
 * 
 * This file configures content paths, custom theme extensions (colors, fonts),
 * and Tailwind plugins to match the Smooci design system.
 * 
 * @type {import('tailwindcss').Config} 
 */
export default {
  // Define content files to scan for Tailwind utility classes
  // 定义需要扫描 Tailwind 实用类名的文件路径
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom Color Palette mimicking the original Smooci theme
      // 自定义配色方案，完美复刻 Smooci 原版主题色彩
      colors: {
        primary: {
          DEFAULT: '#ff2484', // Smooci signature hot pink / 招牌玫粉色
          hover: '#e0166c',   // Darker pink for hover state / 悬浮态深粉色
        },
        hellobar: {
          DEFAULT: '#1fc8db', // Turquoise blue for announcement bar / 顶部栏松石绿
        },
        banner: {
          DEFAULT: '#fcf7e5', // Creamy yellow background for cookies / cookie提示浅黄色
        },
        neutral: {
          dark: '#363636',    // Text dark color / 深灰文字颜色
          medium: '#4a4a4a',  // Regular text color / 普通文字颜色
          light: '#7a7a7a',   // Muted text color / 浅灰文字颜色
          bgLight: '#f5f5f5', // Light section background / 浅灰色背景
        }
      },
      // Nunito font family configuration
      // 配置 Nunito 字体系统
      fontFamily: {
        nunito: ['Nunito', 'Helvetica', 'Arial', 'sans-serif'],
      },
      // Box shadow extensions for cards and badges
      // 自定义卡片与徽章的阴影效果
      boxShadow: {
        card: '0 8px 16px rgba(10, 10, 10, 0.1)',
        glow: '0 0 10px rgba(255, 36, 132, 0.5)',
      }
    },
  },
  plugins: [],
}
