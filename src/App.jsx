import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { sections } from './content/sections'
import './App.css'

function SectionPage() {
  const { sectionId } = useParams()
  const section = sections.find(sec => sec.id === sectionId)
  if (!section) return <div>Section not found</div>
  const SectionComponent = section.Component
  return <SectionComponent />
}

function SubsectionPage() {
  const { sectionId, subsectionId } = useParams()
  const section = sections.find(sec => sec.id === sectionId)
  if (!section) return <div>Section not found</div>
  const subsection = section.subsections.find(sub => sub.id === subsectionId)
  if (!subsection) return <div>Subsection not found</div>
  const SubComponent = subsection.Component
  return <SubComponent />
}

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar sections={sections} />
        <div className="content">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to={`/${sections[0].id}`} replace />} />
              <Route path="/:sectionId" element={<SectionPage />} />
              <Route path="/:sectionId/:subsectionId" element={<SubsectionPage />} />
              <Route path="*" element={<div>Not found</div>} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </Router>
  )
}

export default App