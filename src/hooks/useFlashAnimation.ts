import { useCallback, useEffect, useRef, useState } from "react"

export interface FlashAnimation<K> {
    flashMap: Map<K, number>
    flash: (keys: Iterable<K>) => void
    reset: () => void
}

export function useFlashAnimation<K>(duration: number): FlashAnimation<K> {
    const [flashMap, setFlashMap] = useState(() => new Map<K, number>())
    // flashMapRef mirrors state so flash() can read current counts synchronously.
    const flashMapRef = useRef(new Map<K, number>())
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

    // Cancel all pending timers on unmount
    useEffect(() => {
        return () => {
            for (const t of timersRef.current) clearTimeout(t)
        }
    }, [])

    const flash = useCallback(
        (keys: Iterable<K>) => {
            const keyArr = [...keys]
            if (keyArr.length === 0) return

            // Compute stagger: the maximum existing reference count across all
            // keys in this batch. A count of N means N timers are already queued
            // for those keys, so we schedule after all of them by delaying an
            // additional N * duration.
            const maxExisting = keyArr.reduce(
                (max, k) => Math.max(max, flashMapRef.current.get(k) ?? 0),
                0,
            )
            const delay = duration + maxExisting * duration

            // Increment counts immediately
            const nextMap = new Map(flashMapRef.current)
            for (const k of keyArr) nextMap.set(k, (nextMap.get(k) ?? 0) + 1)
            flashMapRef.current = nextMap
            setFlashMap(new Map(nextMap))

            const timer = setTimeout(() => {
                const after = new Map(flashMapRef.current)
                for (const k of keyArr) {
                    const count = after.get(k) ?? 0
                    if (count <= 1) after.delete(k)
                    else after.set(k, count - 1)
                }
                flashMapRef.current = after
                setFlashMap(new Map(after))
                timersRef.current = timersRef.current.filter((t) => t !== timer)
            }, delay)

            timersRef.current.push(timer)
        },
        [duration],
    )

    const reset = useCallback(() => {
        for (const t of timersRef.current) clearTimeout(t)
        timersRef.current = []
        flashMapRef.current = new Map()
        setFlashMap(new Map())
    }, [])

    return { flashMap, flash, reset }
}
