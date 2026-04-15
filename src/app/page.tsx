'use client'
import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { EffectComposer, Outline } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { createClient } from 'next-sanity'


type HoverKey = 'illustrations' | 'about' | 'animations' | null
type ActivePanel = 'animations' | 'illustrations' | 'about' | null

type AnimationItem = {
  _id: string
  title?: string
  videoUrl?: string
  thumbnail?: string
  _createdAt?: string
}

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})

function Model({
  setHoveredObjects,
  setHoveredKey,
  setActivePanel,
}: {
  setHoveredObjects: React.Dispatch<React.SetStateAction<any[]>>
  setHoveredKey: React.Dispatch<React.SetStateAction<HoverKey>>
  setActivePanel: React.Dispatch<React.SetStateAction<ActivePanel>>
}) {
  const { scene, animations } = useGLTF('/room.glb')
  const currentHoverRef = useRef<any>(null)
  const { actions } = useAnimations(animations, scene)
  useEffect(() => {
  if (!actions) return

  const firstAction = Object.values(actions)[0]
  firstAction?.play()
}, [actions])

  useEffect(() => {
    scene.traverse((child: any) => {
      child.userData.route = null
      child.userData.hoverKey = null
      child.userData.panel = null

      if (child.name === 'Picture') {
  child.userData.panel = 'illustrations'
  child.userData.hoverKey = 'illustrations'
}

      if (child.name === 'Pinboard') {
  child.userData.panel = 'about'
  child.userData.hoverKey = 'about'
}

      if (child.name === 'Computer') {
        child.userData.panel = 'animations'
        child.userData.hoverKey = 'animations'
      }
    })

    return () => {
      document.body.style.cursor = 'default'
    }
  }, [scene])

  function findInteractiveObject(obj: any) {
    let current = obj

    while (current) {
      if (current.userData?.route || current.userData?.panel) {
        return current
      }
      current = current.parent
    }

    return null
  }

  function getMeshDescendants(target: any) {
    const meshes: any[] = []

    target.traverse((child: any) => {
      if (child.isMesh) {
        meshes.push(child)
      }
    })

    return meshes
  }

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
      onPointerMove={(e: any) => {
        e.stopPropagation()

        const target = findInteractiveObject(e.object)

        if (target) {
          document.body.style.cursor = 'pointer'

          if (currentHoverRef.current !== target) {
            currentHoverRef.current = target
            setHoveredObjects(getMeshDescendants(target))
            setHoveredKey(target.userData.hoverKey ?? null)
          }
        } else {
          document.body.style.cursor = 'default'
          currentHoverRef.current = null
          setHoveredObjects([])
          setHoveredKey(null)
        }
      }}
      onPointerOut={(e: any) => {
        e.stopPropagation()
        document.body.style.cursor = 'default'
        currentHoverRef.current = null
        setHoveredObjects([])
        setHoveredKey(null)
      }}
      onPointerDown={(e: any) => {
        e.stopPropagation()

        const target = findInteractiveObject(e.object)
        if (!target) return

        if (target.userData?.panel === 'animations') {
  setActivePanel('animations')
  return
}

if (target.userData?.panel === 'illustrations') {
  setActivePanel('illustrations')
  return
}
if (target.userData?.panel === 'about') {
  setActivePanel('about')
  return
}

        if (target.userData?.route) {
          window.location.href = target.userData.route
        }
      }}
    />
  )
}

function labelClass(active: boolean) {
  return active
    ? 'text-white font-semibold underline underline-offset-4'
    : 'text-neutral-300 hover:text-white transition-colors'
}

function AnimationsWindow({
  isOpen,
  onClose,
  topOffset = 120,
}: {
  isOpen: boolean
  onClose: () => void
  topOffset?: number
}) {
  const [items, setItems] = useState<AnimationItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    async function loadAnimations() {
      setLoading(true)

      try {
        const data = await sanityClient.fetch(`
  *[_type == "animation"] | order(_createdAt desc) {
    _id,
    title,
    _createdAt,
    "videoUrl": videoFile.asset->url,
    "thumbnail": thumbnail.asset->url
  }
`)

        if (!cancelled) {
          setItems(data || [])
        }
      } catch (error) {
        console.error('Failed to load animations:', error)
        if (!cancelled) {
          setItems([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAnimations()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 z-20 transition-transform duration-500 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ top: `${topOffset}px` }}
    >
      <div className="h-full px-6 pb-6">
        <div className="h-full border-2 border-[#d4d0c8] bg-[#c0c0c0] shadow-[6px_6px_0px_rgba(0,0,0,0.45)] flex flex-col">
          {/* Title bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#000080] text-white border-b-2 border-[#808080]">
            <div className="font-bold tracking-wide text-sm">
              ANIMATIONS
            </div>

            <button
              onClick={onClose}
              className="min-w-[28px] h-7 px-2 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black font-bold text-sm"
            >
              X
            </button>
          </div>

          {/* Inner panel */}
          <div className="flex-1 min-h-0 border-t-2 border-l-2 border-[#808080] bg-[#dfdfdf] p-4 overflow-y-auto">
            

            {loading ? (
              <div className="text-black text-sm">Loading clips...</div>
            ) : items.length === 0 ? (
              <div className="text-black text-sm">
                No animation clips found yet.
              </div>
            ) : (
              <div className="columns-1 md:columns-2 xl:columns-3 gap-4 [column-fill:_balance]">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="mb-4 break-inside-avoid border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-[#f3f3f3] p-3 text-black"
                  >
                    <div className="mb-2 text-sm font-bold uppercase tracking-wide">
                      {item.title || 'Untitled Clip'}
                    </div>

                    {item.videoUrl ? (
                      <video
                        src={item.videoUrl}
                        controls
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-auto border border-black bg-black"
                        poster={item.thumbnail || undefined}
                      />
                    ) : item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title || 'Animation thumbnail'}
                        className="w-full h-auto border border-black"
                      />
                    ) : (
                      <div className="w-full aspect-video border border-black bg-[#bdbdbd] flex items-center justify-center text-xs">
                        No preview available
                      </div>
                    )}

                    {item._createdAt && (
                      <div className="mt-2 text-xs text-[#333333]">
                        Added: {new Date(item._createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function IllustrationsWindow({
  isOpen,
  onClose,
  topOffset = 120,
}: {
  isOpen: boolean
  onClose: () => void
  topOffset?: number
}) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    async function loadIllustrations() {
      setLoading(true)

      try {
        const data = await sanityClient.fetch(`
          *[_type == "illustration"] | order(_createdAt desc) {
            _id,
            title,
            year,
            description,
            _createdAt,
            "imageUrl": image.asset->url
          }
        `)

        if (!cancelled) {
          setItems(data || [])
        }
      } catch (error) {
        console.error('Failed to load illustrations:', error)
        if (!cancelled) {
          setItems([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadIllustrations()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectedIndex === null) return

      if (e.key === 'Escape') {
        setSelectedIndex(null)
      }

      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => {
          if (prev === null || items.length === 0) return prev
          return (prev + 1) % items.length
        })
      }

      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => {
          if (prev === null || items.length === 0) return prev
          return (prev - 1 + items.length) % items.length
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, items.length])

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(null)
    }
  }, [isOpen])

  function frameClasses(index: number) {
    const rotations = [
      '-rotate-[1deg]',
      'rotate-[0.8deg]',
      '-rotate-[0.5deg]',
      'rotate-[1.2deg]',
      '-rotate-[0.7deg]',
      'rotate-[0.4deg]',
    ]

    const widths = [
      'w-[82%]',
      'w-[76%]',
      'w-[86%]',
      'w-[78%]',
      'w-[84%]',
      'w-[74%]',
    ]

    const offsets = [
      'ml-[2%]',
      'ml-[8%]',
      'ml-[1%]',
      'ml-[6%]',
      'ml-[3%]',
      'ml-[9%]',
    ]

    return `${rotations[index % rotations.length]} ${widths[index % widths.length]} ${offsets[index % offsets.length]}`
  }

  const selectedItem =
    selectedIndex !== null && items[selectedIndex] ? items[selectedIndex] : null

  function goNext() {
    if (items.length === 0 || selectedIndex === null) return
    setSelectedIndex((selectedIndex + 1) % items.length)
  }

  function goPrev() {
    if (items.length === 0 || selectedIndex === null) return
    setSelectedIndex((selectedIndex - 1 + items.length) % items.length)
  }

  return (
    <>
      <div
        className={`fixed left-0 right-0 bottom-0 z-20 transition-transform duration-500 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ top: `${topOffset}px` }}
      >
        <div className="h-full px-6 pb-6">
          <div className="h-full overflow-hidden border border-[#b8ae9e] bg-[#ece6dc] shadow-[6px_6px_0px_rgba(0,0,0,0.25)] flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#c9bba8] bg-[#e4dbcf]">
              <div className="text-[#2d241d] font-semibold tracking-[0.2em] text-sm uppercase">
                Illustrations
              </div>

              <button
                onClick={onClose}
                className="px-3 py-1 border border-[#8f8474] bg-[#f4efe8] text-[#2d241d] text-sm hover:bg-[#ebe3d8]"
              >
                Close
              </button>
            </div>

            {/* Scroll area */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-8"
              style={{
                backgroundColor: '#bbad99b0',
                backgroundImage: `
                  radial-gradient(rgba(120, 102, 84, 0.08) 0.6px, transparent 0.6px),
                  linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14))
                `,
                backgroundSize: '12px 12px, 100% 100%',
              }}
            >
              

              {loading ? (
                <div className="text-[#2d241d] text-sm">Loading illustrations...</div>
              ) : items.length === 0 ? (
                <div className="text-[#2d241d] text-sm">No illustrations found yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-10 gap-x-4 items-start">
                  {items.map((item, index) => (
                    <div key={item._id} className="flex justify-center">
                      <div className={frameClasses(index)}>
                        <div className="relative">
                          {/* frame */}
                          <button
                            onClick={() => setSelectedIndex(index)}
                            className="block w-full text-left"
                          >
                            <div className="bg-[#6e4f34] p-3 shadow-[5px_5px_0px_rgba(0,0,0,0.16)] transition-transform hover:scale-[1.01]">
                              <div className="bg-[#caa56a] p-2">
                                <div className="bg-[#efe8dc] p-3">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title || 'Illustration'}
                                      className="w-full h-auto block"
                                    />
                                  ) : (
                                    <div className="w-full aspect-[4/5] bg-[#d8d0c4] flex items-center justify-center text-xs text-[#4e4438]">
                                      No image
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* wall label */}
                          <div className="mt-3 inline-block bg-[#f3eee6] border border-[#cfc3b2] px-3 py-2 shadow-[2px_2px_0px_rgba(0,0,0,0.08)]">
                            <div className="text-[#2d241d] font-medium text-sm leading-tight">
                              {item.title || 'Untitled'}
                              {item.year ? ` (${item.year})` : ''}
                            </div>

                            {item.description && (
                              <div className="mt-1 text-[#5a5045] text-xs leading-relaxed max-w-[28ch]">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded image overlay */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-30 bg-black/75 flex items-center justify-center p-8"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative max-w-6xl max-h-[88vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous */}
            {items.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 px-4 py-3 bg-[#f4efe8] border border-[#8f8474] text-[#2d241d] text-sm shadow-[3px_3px_0px_rgba(0,0,0,0.2)] hover:bg-[#ebe3d8]"
              >
                ←
              </button>
            )}

            {/* Content */}
            <div className="w-full max-h-[88vh] overflow-auto bg-[#ece6dc] border border-[#b8ae9e] shadow-[8px_8px_0px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#c9bba8] bg-[#e4dbcf]">
                <div className="text-[#2d241d] font-semibold tracking-wide text-sm">
                  {selectedItem.title || 'Untitled'}
                </div>

                <button
                  onClick={() => setSelectedIndex(null)}
                  className="px-3 py-1 border border-[#8f8474] bg-[#f4efe8] text-[#2d241d] text-sm hover:bg-[#ebe3d8]"
                >
                  Close
                </button>
              </div>

              <div className="p-6">
                <div className="bg-[#dcd2c4] p-4 border border-[#d8cdbc]">
                  {selectedItem.imageUrl && (
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.title || 'Illustration'}
                      className="w-full h-auto block max-h-[68vh] object-contain mx-auto"
                    />
                  )}
                </div>

                <div className="mt-4 inline-block bg-[#f3eee6] border border-[#cfc3b2] px-4 py-3 shadow-[2px_2px_0px_rgba(0,0,0,0.08)]">
                  <div className="text-[#2d241d] font-medium text-base">
                    {selectedItem.title || 'Untitled'}
                    {selectedItem.year ? ` (${selectedItem.year})` : ''}
                  </div>

                  {selectedItem.description && (
                    <div className="mt-2 text-[#5a5045] text-sm leading-relaxed max-w-[60ch]">
                      {selectedItem.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Next */}
            {items.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 px-4 py-3 bg-[#f4efe8] border border-[#8f8474] text-[#2d241d] text-sm shadow-[3px_3px_0px_rgba(0,0,0,0.2)] hover:bg-[#ebe3d8]"
              >
                →
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function AboutWindow({
  isOpen,
  onClose,
  topOffset = 120,
}: {
  isOpen: boolean
  onClose: () => void
  topOffset?: number
}) {
  return (
    <div
      className={`fixed left-0 right-0 bottom-0 z-20 transition-transform duration-500 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ top: `${topOffset}px` }}
    >
      <div className="h-full px-6 pb-6">
        <div className="h-full overflow-hidden flex flex-col bg-transparent relative">
          <div className="absolute top-4 right-10 z-30">
  <button
    onClick={onClose}
    className="px-3 py-1 border border-[#8f8474] bg-[#f4efe8] text-[#2d241d] text-sm shadow-[3px_3px_0px_rgba(0,0,0,0.14)] hover:bg-[#ebe3d8]"
  >
    Close
  </button>
</div>
         

          {/* Scroll area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-8 pt-2 pb-8 bg-black/10 backdrop-blur-md">
            <div className="mx-auto max-w-3xl">
              {/* Paper */}
              <div className="bg-[#f8f2e8] border border-[#d8cdbc] shadow-[8px_8px_0px_rgba(0,0,0,0.16)] px-10 py-12 relative">
                <h2 className="text-3xl text-[#2d241d] font-serif mb-8">
                  About
                </h2>

                <div className="space-y-6 text-[#3f372f] leading-8 text-[17px]">
                  <p>
                    Gusteenee
                    
                  </p>
                  <p>
                    Melbourne
                  </p>

                  <p>
                    Gusteenee is an artist based in Melbourne who uses illustration and animation to create unreal and familiar worlds. Inspired by the wonder and mystique of video games and digital spaces of previous eras, they utilise programs such as Blender to create liminal digital worlds that pay homage to older media, eliciting an otherworldly sensation that you’ve been here before, even in some long forgotten dream.

                  </p>

                  <p>
                    
                  </p>

                  <p>
                    
                  </p>
                </div>

                {/* Sticky notes */}
                <div className="mt-14 flex justify-center gap-10">
  <a
    href="https://www.instagram.com/gusteenee/"
    target="_blank"
    rel="noopener noreferrer"
    className="block w-36 h-36 bg-[#f3dc55] shadow-[3px_3px_0px_rgba(0,0,0,0.14)] rotate-[-2deg] border border-[#d1ba38] hover:scale-[1.02] transition-transform cursor-pointer"
  >
    <div className="w-full h-full flex items-center justify-center text-[#6b5c12] text-xs text-center p-3">
      Link One
    </div>
  </a>

  <a
    href="https://www.tiktok.com/@gusteenee"
    target="_blank"
    rel="noopener noreferrer"
    className="block w-36 h-36 bg-[#f3dc55] shadow-[3px_3px_0px_rgba(0,0,0,0.14)] rotate-[2deg] border border-[#d1ba38] hover:scale-[1.02] transition-transform cursor-pointer"
  >
    <div className="w-full h-full flex items-center justify-center text-[#6b5c12] text-xs text-center p-3">
      Link Two
    </div>
  </a>
</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [hoveredObjects, setHoveredObjects] = useState<any[]>([])
  const [hoveredKey, setHoveredKey] = useState<HoverKey>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
   const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return (
    <main className="h-screen w-screen bg-black relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full z-10 text-white pointer-events-auto">
        <div className="w-full text-center mt-4 mb-2">
          <button
  onClick={() => {
    setActivePanel(null)
  }}
  className="text-4xl tracking-widest font-semibold hover:opacity-80 transition-opacity cursor-pointer"
>
  GUSTEENEE
</button>
        </div>

        <div className="w-full flex justify-around items-center bg-black/40 backdrop-blur-sm py-3 text-lg tracking-wide">
          <button
  onClick={() => setActivePanel('illustrations')}
  className={labelClass(hoveredKey === 'illustrations' || activePanel === 'illustrations')}
>
  Illustrations
</button>

          <button
  onClick={() => setActivePanel('about')}
  className={labelClass(hoveredKey === 'about' || activePanel === 'about')}
>
  About
</button>

          <button
            onClick={() => setActivePanel('animations')}
            className={labelClass(hoveredKey === 'animations' || activePanel === 'animations')}
          >
            Animations
          </button>

          <span className="text-neutral-600 cursor-not-allowed">Shop</span>
        </div>
      </div>

      <Canvas
  key={isMobile ? 'camera-mobile-1' : 'camera-desktop-1'}
  camera={
    isMobile
      ? { position: [0, 0.2, 10], fov: 24 }
      : { position: [0, 0.2, 8], fov: 15 }
  }
>
        <ambientLight intensity={1} />
        <pointLight position={[2, 3, 4]} intensity={20} />

        <Model
          setHoveredObjects={setHoveredObjects}
          setHoveredKey={setHoveredKey}
          setActivePanel={setActivePanel}
        />

        <EffectComposer autoClear={false}>
          <Outline
            selection={hoveredObjects}
            blendFunction={BlendFunction.SCREEN}
            edgeStrength={6}
            visibleEdgeColor={0xffffff}
            hiddenEdgeColor={0x666666}
            blur={false}
            xRay={true}
          />
        </EffectComposer>
      </Canvas>

      <AnimationsWindow
        isOpen={activePanel === 'animations'}
        onClose={() => setActivePanel(null)}
        topOffset={120}
      />
      <IllustrationsWindow
  isOpen={activePanel === 'illustrations'}
  onClose={() => setActivePanel(null)}
  topOffset={120}
/>

<AboutWindow
  isOpen={activePanel === 'about'}
  onClose={() => setActivePanel(null)}
  topOffset={120}
/>
    </main>
  )
}

useGLTF.preload('/room.glb')