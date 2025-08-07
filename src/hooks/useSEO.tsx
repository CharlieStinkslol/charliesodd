import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOData {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonicalUrl: string;
  robots: string;
  customMeta: string;
}

export const useSEO = () => {
  const location = useLocation();

  useEffect(() => {
    const updateSEO = () => {
      const savedSEO = localStorage.getItem('charlies-odds-seo-settings');
      let seoSettings: { [key: string]: SEOData } = {};
      
      if (savedSEO) {
        seoSettings = JSON.parse(savedSEO);
      }
      
      const currentPageSEO = seoSettings[location.pathname] || seoSettings['/'] || {
        title: 'CharliesOdds - Advanced Demo Casino Platform',
        description: 'Experience the most advanced demo casino with professional features',
        keywords: 'demo casino, free casino games, auto betting',
        ogTitle: 'CharliesOdds - Advanced Demo Casino',
        ogDescription: 'Professional demo casino platform',
        ogImage: 'https://images.pexels.com/photos/1111597/pexels-photo-1111597.jpeg',
        twitterTitle: 'CharliesOdds',
        twitterDescription: 'Advanced demo casino',
        twitterImage: 'https://images.pexels.com/photos/1111597/pexels-photo-1111597.jpeg',
        canonicalUrl: `https://charliesodds.com${location.pathname}`,
        robots: 'index, follow',
        customMeta: ''
      };

      // Update title
      document.title = currentPageSEO.title;
      
      // Update meta tags
      updateMetaTag('description', currentPageSEO.description);
      updateMetaTag('keywords', currentPageSEO.keywords);
      updateMetaTag('robots', currentPageSEO.robots);
      
      // Update Open Graph tags
      updateMetaTag('og:title', currentPageSEO.ogTitle, 'property');
      updateMetaTag('og:description', currentPageSEO.ogDescription, 'property');
      updateMetaTag('og:image', currentPageSEO.ogImage, 'property');
      updateMetaTag('og:url', currentPageSEO.canonicalUrl, 'property');
      updateMetaTag('og:type', 'website', 'property');
      
      // Update Twitter tags
      updateMetaTag('twitter:card', 'summary_large_image', 'name');
      updateMetaTag('twitter:title', currentPageSEO.twitterTitle, 'name');
      updateMetaTag('twitter:description', currentPageSEO.twitterDescription, 'name');
      updateMetaTag('twitter:image', currentPageSEO.twitterImage, 'name');
      
      // Update canonical URL
      updateLinkTag('canonical', currentPageSEO.canonicalUrl);
      
      // Add custom meta tags
      if (currentPageSEO.customMeta) {
        const customMetaContainer = document.getElementById('custom-meta-tags');
        if (customMetaContainer) {
          customMetaContainer.innerHTML = currentPageSEO.customMeta;
        } else {
          const container = document.createElement('div');
          container.id = 'custom-meta-tags';
          container.innerHTML = currentPageSEO.customMeta;
          document.head.appendChild(container);
        }
      }
    };

    updateSEO();
  }, [location.pathname]);

  const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
    let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    element.content = content;
  };

  const updateLinkTag = (rel: string, href: string) => {
    let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
    if (!element) {
      element = document.createElement('link');
      element.rel = rel;
      document.head.appendChild(element);
    }
    element.href = href;
  };
};