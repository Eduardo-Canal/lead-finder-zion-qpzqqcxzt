import React, { useEffect, useRef } from 'react'

export function ZionGlobalBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let w = container.clientWidth
    let h = container.clientHeight
    canvas.width = w
    canvas.height = h

    let centerX = w / 2
    let centerY = h / 2
    let globeRadius = Math.min(w, h) * 0.45

    const stars = Array.from({ length: 300 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.5,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random(),
    }))

    const nodeCount = 450
    const nodes = Array.from({ length: nodeCount }).map((_, i) => {
      const phi = Math.acos(-1 + (2 * i) / nodeCount)
      const theta = Math.sqrt(nodeCount * Math.PI) * phi
      return {
        baseX: globeRadius * Math.cos(theta) * Math.sin(phi),
        baseY: globeRadius * Math.sin(theta) * Math.sin(phi),
        baseZ: globeRadius * Math.cos(phi),
        color: Math.random() > 0.6 ? '#3b82f6' : '#10b981',
      }
    })

    const connections: any[] = []
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = Math.hypot(
          nodes[i].baseX - nodes[j].baseX,
          nodes[i].baseY - nodes[j].baseY,
          nodes[i].baseZ - nodes[j].baseZ,
        )
        if (dist > 10 && dist < globeRadius * 0.35 && Math.random() > 0.94) {
          connections.push({
            from: i,
            to: j,
            active: Math.random() > 0.7,
            progress: Math.random(),
          })
        }
      }
    }

    let angleY = 0
    let angleX = 0.15
    let animationFrame: number
    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      targetMouseX = ((e.clientX - rect.left) / w - 0.5) * 2
      targetMouseY = ((e.clientY - rect.top) / h - 0.5) * 2
    }

    container.addEventListener('mousemove', handleMouseMove)

    const draw = () => {
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      ctx.fillStyle = '#020617'
      ctx.fillRect(0, 0, w, h)

      stars.forEach((star) => {
        star.y -= star.speed
        if (star.y < 0) {
          star.y = h
          star.x = Math.random() * w
        }
        const px = star.x + mouseX * 20 * star.speed
        const py = star.y + mouseY * 20 * star.speed

        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.beginPath()
        ctx.arc(px, py, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      angleY += 0.0015
      const sinY = Math.sin(angleY)
      const cosY = Math.cos(angleY)
      const sinX = Math.sin(angleX + mouseY * 0.2)
      const cosX = Math.cos(angleX + mouseY * 0.2)

      const projectedNodes = nodes.map((node) => {
        let x = node.baseX * cosY - node.baseZ * sinY
        let z = node.baseZ * cosY + node.baseX * sinY
        let y = node.baseY

        let y2 = y * cosX - z * sinX
        let z2 = z * cosX + y * sinX

        const scale = 1200 / (1200 + z2)
        const px = centerX + x * scale + mouseX * 40
        const py = centerY + y2 * scale + mouseY * 40

        return { x: px, y: py, z: z2, scale, color: node.color }
      })

      ctx.lineWidth = 0.8
      connections.forEach((conn) => {
        const p1 = projectedNodes[conn.from]
        const p2 = projectedNodes[conn.to]

        const avgZ = (p1.z + p2.z) / 2
        const opacity = avgZ < 0 ? 0.35 : 0.05

        if (opacity > 0.01) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.4})`
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()

          if (conn.active) {
            conn.progress += 0.012
            if (conn.progress > 1) {
              conn.progress = 0
              conn.active = Math.random() > 0.4
            }
            const dataX = p1.x + (p2.x - p1.x) * conn.progress
            const dataY = p1.y + (p2.y - p1.y) * conn.progress

            const glowOpacity = opacity * 2.5
            ctx.fillStyle =
              p1.color === '#3b82f6'
                ? `rgba(59, 130, 246, ${glowOpacity})`
                : `rgba(16, 185, 129, ${glowOpacity})`
            ctx.beginPath()
            ctx.arc(dataX, dataY, 1.5 * p1.scale, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })

      projectedNodes.forEach((p) => {
        const opacity = p.z < 0 ? 0.8 : 0.2
        ctx.fillStyle =
          p.color === '#3b82f6'
            ? `rgba(59, 130, 246, ${opacity})`
            : `rgba(16, 185, 129, ${opacity})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.2 * p.scale, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrame = requestAnimationFrame(draw)
    }

    draw()

    const handleResize = () => {
      if (!container) return
      w = container.clientWidth
      h = container.clientHeight
      canvas.width = w
      canvas.height = h
      centerX = w / 2
      centerY = h / 2
      globeRadius = Math.min(w, h) * 0.45

      nodes.forEach((node, i) => {
        const phi = Math.acos(-1 + (2 * i) / nodeCount)
        const theta = Math.sqrt(nodeCount * Math.PI) * phi
        node.baseX = globeRadius * Math.cos(theta) * Math.sin(phi)
        node.baseY = globeRadius * Math.sin(theta) * Math.sin(phi)
        node.baseZ = globeRadius * Math.cos(phi)
      })
    }

    window.addEventListener('resize', handleResize)

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousemove', handleMouseMove)
      resizeObserver.disconnect()
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#020617] select-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full object-cover" />
    </div>
  )
}
