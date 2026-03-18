import { useLayoutEffect } from 'react'
import gsap from 'gsap'

export const useGsapStagger = (
  containerRef,
  itemSelector,
  dependencies = [],
  options = {},
) => {
  useLayoutEffect(() => {
    if (!containerRef.current) {
      return undefined
    }

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray(itemSelector)
      if (!items.length) {
        return
      }

      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 12, scale: 0.96 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: options.duration ?? 0.36,
          ease: options.ease ?? 'power2.out',
          stagger: options.stagger ?? 0.04,
          overwrite: 'auto',
        },
      )
    }, containerRef)

    return () => ctx.revert()
  }, [containerRef, itemSelector, ...dependencies]) // eslint-disable-line react-hooks/exhaustive-deps
}
