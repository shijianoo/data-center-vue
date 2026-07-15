import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  beginSessionTransition,
  clearSessionCredentials,
  commitSessionCredentials,
  expireSession,
  getSessionCredentials,
  replaceSessionCredentials,
  setSessionExpirationHandler,
  subscribeSessionCredentials
} from "@/framework/session/session-manager"

describe("session manager", () => {
  beforeEach(() => clearSessionCredentials())

  it("prevents an older tenant switch from overwriting a newer session", () => {
    const older = beginSessionTransition()
    const newer = replaceSessionCredentials({ accessToken: "new-access", refreshToken: "new-refresh" })

    expect(commitSessionCredentials(older, { accessToken: "old-access", refreshToken: "old-refresh" })).toBe(false)
    expect(commitSessionCredentials(newer, { accessToken: "latest-access", refreshToken: "latest-refresh" })).toBe(true)
    expect(getSessionCredentials()).toEqual({ accessToken: "latest-access", refreshToken: "latest-refresh" })
  })

  it("notifies credential listeners atomically and expires a revision only once", () => {
    const listener = vi.fn()
    const expiration = vi.fn()
    const unsubscribe = subscribeSessionCredentials(listener)
    setSessionExpirationHandler(expiration)
    const revision = replaceSessionCredentials({ accessToken: "access", refreshToken: "refresh" })

    expect(listener).toHaveBeenLastCalledWith({ accessToken: "access", refreshToken: "refresh" })
    expireSession(revision)
    expireSession(revision)
    expect(expiration).toHaveBeenCalledOnce()
    unsubscribe()
  })
})
