// Integration Support Contract Tests
import { describe, it, expect, beforeEach } from "vitest"

let mockBlockHeight

describe("Integration Support Contract", () => {
  let mockContract
  let mockTxSender
  
  beforeEach(() => {
    mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    mockBlockHeight = 1000
    
    mockContract = {
      integrationSessions: new Map(),
      supportResources: new Map(),
      nextSessionId: 1,
      nextResourceId: 1,
    }
  })
  
  describe("schedule-session", () => {
    it("should successfully schedule an integration session", () => {
      const sessionData = {
        coachId: "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        programId: 1,
        sessionType: "individual",
        scheduledAt: 1100,
        durationMinutes: 60,
      }
      
      const result = scheduleSession(mockContract, mockTxSender, sessionData)
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(1)
      
      const session = mockContract.integrationSessions.get(1)
      expect(session).toBeDefined()
      expect(session.participantId).toBe(mockTxSender)
      expect(session.coachId).toBe(sessionData.coachId)
      expect(session.sessionType).toBe(sessionData.sessionType)
      expect(session.completed).toBe(false)
      expect(session.notes).toBeNull()
    })
    
    it("should increment session ID for multiple sessions", () => {
      const sessionData1 = {
        coachId: "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        programId: 1,
        sessionType: "group",
        scheduledAt: 1100,
        durationMinutes: 90,
      }
      
      const sessionData2 = {
        coachId: "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        programId: 2,
        sessionType: "virtual",
        scheduledAt: 1200,
        durationMinutes: 45,
      }
      
      const result1 = scheduleSession(mockContract, mockTxSender, sessionData1)
      const result2 = scheduleSession(mockContract, mockTxSender, sessionData2)
      
      expect(result1.value).toBe(1)
      expect(result2.value).toBe(2)
      expect(mockContract.nextSessionId).toBe(3)
    })
  })
  
  describe("complete-session", () => {
    let sessionId
    let coachId
    
    beforeEach(() => {
      coachId = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const sessionData = {
        coachId: coachId,
        programId: 1,
        sessionType: "individual",
        scheduledAt: 1100,
        durationMinutes: 60,
      }
      const result = scheduleSession(mockContract, mockTxSender, sessionData)
      sessionId = result.value
    })
    
    it("should successfully complete a session with notes", () => {
      const notes = "Great progress made in understanding core concepts"
      const result = completeSession(mockContract, coachId, sessionId, notes)
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
      
      const session = mockContract.integrationSessions.get(sessionId)
      expect(session.completed).toBe(true)
      expect(session.notes).toBe(notes)
    })
    
    it("should fail if not the assigned coach", () => {
      const unauthorizedUser = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const notes = "Unauthorized completion attempt"
      const result = completeSession(mockContract, unauthorizedUser, sessionId, notes)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("ERR_UNAUTHORIZED")
    })
    
    it("should fail if session does not exist", () => {
      const nonExistentSessionId = 999
      const notes = "Test notes"
      const result = completeSession(mockContract, coachId, nonExistentSessionId, notes)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("ERR_SESSION_NOT_FOUND")
    })
  })
  
  describe("rate-session", () => {
    let sessionId
    
    beforeEach(() => {
      const coachId = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const sessionData = {
        coachId: coachId,
        programId: 1,
        sessionType: "individual",
        scheduledAt: 1100,
        durationMinutes: 60,
      }
      const result = scheduleSession(mockContract, mockTxSender, sessionData)
      sessionId = result.value
    })
    
    it("should successfully rate a session", () => {
      const rating = 4
      const result = rateSession(mockContract, mockTxSender, sessionId, rating)
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
      
      const session = mockContract.integrationSessions.get(sessionId)
      expect(session.effectivenessRating).toBe(rating)
    })
    
    it("should fail with invalid rating below 1", () => {
      const invalidRating = 0
      const result = rateSession(mockContract, mockTxSender, sessionId, invalidRating)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("ERR_INVALID_RATING")
    })
    
    it("should fail with invalid rating above 5", () => {
      const invalidRating = 6
      const result = rateSession(mockContract, mockTxSender, sessionId, invalidRating)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("ERR_INVALID_RATING")
    })
    
    it("should fail if not the participant", () => {
      const unauthorizedUser = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const rating = 4
      const result = rateSession(mockContract, unauthorizedUser, sessionId, rating)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("ERR_UNAUTHORIZED")
    })
  })
  
  describe("add-support-resource", () => {
    it("should successfully add a support resource", () => {
      const resourceData = {
        title: "Mindfulness Meditation Guide",
        description: "Comprehensive guide to mindfulness practices",
        resourceType: "meditation",
        accessLevel: "public",
      }
      
      const result = addSupportResource(mockContract, mockTxSender, resourceData)
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(1)
      
      const resource = mockContract.supportResources.get(1)
      expect(resource).toBeDefined()
      expect(resource.title).toBe(resourceData.title)
      expect(resource.coachId).toBe(mockTxSender)
      expect(resource.createdAt).toBe(mockBlockHeight)
    })
    
    it("should increment resource ID for multiple resources", () => {
      const resource1 = {
        title: "Breathing Exercises",
        description: "Basic breathing techniques",
        resourceType: "exercise",
        accessLevel: "program",
      }
      
      const resource2 = {
        title: "Advanced Consciousness Reading",
        description: "Deep dive into consciousness studies",
        resourceType: "reading",
        accessLevel: "premium",
      }
      
      const result1 = addSupportResource(mockContract, mockTxSender, resource1)
      const result2 = addSupportResource(mockContract, mockTxSender, resource2)
      
      expect(result1.value).toBe(1)
      expect(result2.value).toBe(2)
      expect(mockContract.nextResourceId).toBe(3)
    })
  })
  
  describe("get-session", () => {
    it("should return session data if exists", () => {
      const sessionData = {
        coachId: "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        programId: 1,
        sessionType: "virtual",
        scheduledAt: 1100,
        durationMinutes: 45,
      }
      const createResult = scheduleSession(mockContract, mockTxSender, sessionData)
      const sessionId = createResult.value
      
      const result = getSession(mockContract, sessionId)
      
      expect(result).toBeDefined()
      expect(result.participantId).toBe(mockTxSender)
      expect(result.sessionType).toBe(sessionData.sessionType)
      expect(result.durationMinutes).toBe(sessionData.durationMinutes)
    })
    
    it("should return null if session does not exist", () => {
      const result = getSession(mockContract, 999)
      
      expect(result).toBeNull()
    })
  })
  
  describe("get-support-resource", () => {
    it("should return resource data if exists", () => {
      const resourceData = {
        title: "Test Resource",
        description: "Test resource description",
        resourceType: "meditation",
        accessLevel: "public",
      }
      const createResult = addSupportResource(mockContract, mockTxSender, resourceData)
      const resourceId = createResult.value
      
      const result = getSupportResource(mockContract, resourceId)
      
      expect(result).toBeDefined()
      expect(result.title).toBe(resourceData.title)
      expect(result.resourceType).toBe(resourceData.resourceType)
      expect(result.coachId).toBe(mockTxSender)
    })
    
    it("should return null if resource does not exist", () => {
      const result = getSupportResource(mockContract, 999)
      
      expect(result).toBeNull()
    })
  })
})

// Mock contract functions
function scheduleSession(contract, txSender, sessionData) {
  const sessionId = contract.nextSessionId
  const session = {
    participantId: txSender,
    coachId: sessionData.coachId,
    programId: sessionData.programId,
    sessionType: sessionData.sessionType,
    scheduledAt: sessionData.scheduledAt,
    durationMinutes: sessionData.durationMinutes,
    completed: false,
    notes: null,
    effectivenessRating: null,
  }
  
  contract.integrationSessions.set(sessionId, session)
  contract.nextSessionId += 1
  
  return { success: true, value: sessionId }
}

function completeSession(contract, txSender, sessionId, notes) {
  const session = contract.integrationSessions.get(sessionId)
  if (!session) {
    return { success: false, error: "ERR_SESSION_NOT_FOUND" }
  }
  
  if (txSender !== session.coachId) {
    return { success: false, error: "ERR_UNAUTHORIZED" }
  }
  
  session.completed = true
  session.notes = notes
  contract.integrationSessions.set(sessionId, session)
  
  return { success: true, value: true }
}

function rateSession(contract, txSender, sessionId, rating) {
  const session = contract.integrationSessions.get(sessionId)
  if (!session) {
    return { success: false, error: "ERR_SESSION_NOT_FOUND" }
  }
  
  if (txSender !== session.participantId) {
    return { success: false, error: "ERR_UNAUTHORIZED" }
  }
  
  if (rating < 1 || rating > 5) {
    return { success: false, error: "ERR_INVALID_RATING" }
  }
  
  session.effectivenessRating = rating
  contract.integrationSessions.set(sessionId, session)
  
  return { success: true, value: true }
}

function addSupportResource(contract, txSender, resourceData) {
  const resourceId = contract.nextResourceId
  const resource = {
    title: resourceData.title,
    description: resourceData.description,
    resourceType: resourceData.resourceType,
    coachId: txSender,
    accessLevel: resourceData.accessLevel,
    createdAt: mockBlockHeight,
  }
  
  contract.supportResources.set(resourceId, resource)
  contract.nextResourceId += 1
  
  return { success: true, value: resourceId }
}

function getSession(contract, sessionId) {
  return contract.integrationSessions.get(sessionId) || null
}

function getSupportResource(contract, resourceId) {
  return contract.supportResources.get(resourceId) || null
}
