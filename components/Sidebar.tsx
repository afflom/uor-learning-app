import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SectionData, sectionsData } from '../src/content/sections/sectionsData';

export default function Sidebar() {
  const router = useRouter();
  const path = router.asPath.split('?')[0];
  return (
    <nav className="sidebar">
      <ul>
        {sectionsData.map((section: SectionData) => {
          const sectionPath = `/${section.id}`;
          const isActiveSection = path === sectionPath || path.startsWith(`${sectionPath}/`);
          return (
            <li key={section.id}>
              <Link href={sectionPath} legacyBehavior>
                <a className={isActiveSection ? 'active' : ''}>
                  {section.title}
                </a>
              </Link>
              {isActiveSection && section.subsections && (
                <ul>
                  {section.subsections.map((sub) => {
                    const subPath = `${sectionPath}/${sub.id}`;
                    const isActiveSub = path === subPath;
                    return (
                      <li key={sub.id}>
                        <Link href={subPath} legacyBehavior>
                          <a className={isActiveSub ? 'active' : ''}>
                            {sub.title}
                          </a>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}