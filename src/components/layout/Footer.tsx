
"use client";

import type React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 py-16 relative overflow-hidden text-gray-900 dark:from-gray-800 dark:to-gray-900 dark:text-gray-100">
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute right-0 top-0 text-gray-100 dark:text-gray-700 w-1/3 -mt-12 opacity-50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M47.5,-73.8C59.9,-66.1,67.6,-49.9,75.2,-33.8C82.9,-17.7,90.6,-1.7,88.1,12.9C85.7,27.5,73.1,40.7,60.1,52C47.1,63.4,33.6,72.9,18.1,78.3C2.6,83.7,-14.9,85.1,-30.1,79.2C-45.2,73.3,-58,60.2,-67.6,45.3C-77.1,30.5,-83.3,13.9,-83.1,-2.5C-83,-18.9,-76.5,-35.1,-65.5,-45.4C-54.5,-55.7,-39.1,-60,-25.7,-67C-12.4,-74,1.9,-83.8,17.1,-84.1C32.3,-84.5,48.3,-75.7,47.5,-73.8Z" transform="translate(100 100)" />
        </svg>
        <svg className="absolute left-0 bottom-0 text-gray-100 dark:text-gray-700 w-1/4 -mb-8 opacity-50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M44.9,-76.2C59.7,-69.2,74.1,-59.3,83.1,-45.4C92.1,-31.6,95.8,-13.9,94.3,3.2C92.7,20.3,86,36.9,75.6,50.1C65.1,63.4,50.9,73.3,35.9,78.9C20.8,84.5,4.9,85.7,-10.6,83.1C-26.1,80.5,-41.3,74.1,-53.3,64.1C-65.3,54.2,-74.1,40.7,-79.7,25.8C-85.3,10.9,-87.6,-5.4,-84.1,-20.5C-80.7,-35.5,-71.5,-49.3,-59.1,-57.3C-46.8,-65.3,-31.4,-67.5,-17.1,-74.2C-2.8,-80.9,10.3,-92.2,24.3,-90.6C38.4,-89.1,53.3,-74.8,61.1,-61C68.9,-47.3,71.5,-34.2,74,-21.2C76.6,-8.1,79.2,4.9,77.2,17.5C75.1,30.1,68.3,42.2,58.7,50.3C49.2,58.3,36.8,62.2,24.1,65.5C11.4,68.7,-1.6,71.3,-15.2,71.4C-28.8,71.5,-43,69.1,-55.3,62.3C-67.7,55.5,-78.2,44.3,-83.1,30.9C-88,17.4,-87.2,1.8,-83.2,-12.4C-79.3,-26.6,-72.2,-39.5,-62.1,-49.2C-51.9,-59,-38.7,-65.7,-25.4,-71.1C-12.1,-76.6,1.3,-80.8,14.4,-80.1C27.5,-79.4,40.3,-73.7,44.9,-76.2Z" transform="translate(100 100)" />
        </svg>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-3">
            <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
                <svg className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="ml-3 text-xl font-medium text-gray-900 dark:text-gray-100">Promptastic!</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs text-center md:text-left">Your ultimate teleprompter assistant. Speak clearly, stay on track.</p>
          </div>
          <nav className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
            <a href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200 relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 dark:bg-gray-100 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200 relative group">
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 dark:bg-gray-100 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200 relative group">
              Blog
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 dark:bg-gray-100 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200 relative group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 dark:bg-gray-100 group-hover:w-full transition-all duration-300" />
            </a>
          </nav>
          <div className="flex space-x-5">
            {/* Placeholder for social icons - Add actual icons or SVGs here */}
            <a href="#" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:-translate-y-1 transition-all duration-300">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:-translate-y-1 transition-all duration-300">
              <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.036 1.531 1.036.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.82c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.942.359.31.678.922.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
            </a>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">© ${new Date().getFullYear()} Promptastic! All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
