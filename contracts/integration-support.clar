;; Integration Support Contract
;; Supports consciousness transformation integration

(define-constant ERR_UNAUTHORIZED (err u400))
(define-constant ERR_SESSION_NOT_FOUND (err u401))
(define-constant ERR_INVALID_RATING (err u402))

;; Integration session data
(define-map integration-sessions
  { session-id: uint }
  {
    participant-id: principal,
    coach-id: principal,
    program-id: uint,
    session-type: (string-ascii 50), ;; "individual", "group", "virtual"
    scheduled-at: uint,
    duration-minutes: uint,
    completed: bool,
    notes: (optional (string-ascii 500)),
    effectiveness-rating: (optional uint)
  }
)

;; Support resources
(define-map support-resources
  { resource-id: uint }
  {
    title: (string-ascii 100),
    description: (string-ascii 300),
    resource-type: (string-ascii 50), ;; "meditation", "exercise", "reading"
    coach-id: principal,
    access-level: (string-ascii 20), ;; "public", "program", "premium"
    created-at: uint
  }
)

;; Session counter
(define-data-var next-session-id uint u1)
(define-data-var next-resource-id uint u1)

;; Schedule integration session
(define-public (schedule-session
  (coach-id principal)
  (program-id uint)
  (session-type (string-ascii 50))
  (scheduled-at uint)
  (duration-minutes uint))
  (let ((session-id (var-get next-session-id)))
    (map-set integration-sessions
      { session-id: session-id }
      {
        participant-id: tx-sender,
        coach-id: coach-id,
        program-id: program-id,
        session-type: session-type,
        scheduled-at: scheduled-at,
        duration-minutes: duration-minutes,
        completed: false,
        notes: none,
        effectiveness-rating: none
      })
    (var-set next-session-id (+ session-id u1))
    (ok session-id)))

;; Complete session with notes
(define-public (complete-session
  (session-id uint)
  (notes (string-ascii 500)))
  (let ((session (unwrap! (map-get? integration-sessions { session-id: session-id }) ERR_SESSION_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get coach-id session)) ERR_UNAUTHORIZED)
    (map-set integration-sessions
      { session-id: session-id }
      (merge session {
        completed: true,
        notes: (some notes)
      }))
    (ok true)))

;; Rate session effectiveness
(define-public (rate-session (session-id uint) (rating uint))
  (let ((session (unwrap! (map-get? integration-sessions { session-id: session-id }) ERR_SESSION_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get participant-id session)) ERR_UNAUTHORIZED)
    (asserts! (and (>= rating u1) (<= rating u5)) ERR_INVALID_RATING)
    (map-set integration-sessions
      { session-id: session-id }
      (merge session { effectiveness-rating: (some rating) }))
    (ok true)))

;; Add support resource
(define-public (add-support-resource
  (title (string-ascii 100))
  (description (string-ascii 300))
  (resource-type (string-ascii 50))
  (access-level (string-ascii 20)))
  (let ((resource-id (var-get next-resource-id)))
    (map-set support-resources
      { resource-id: resource-id }
      {
        title: title,
        description: description,
        resource-type: resource-type,
        coach-id: tx-sender,
        access-level: access-level,
        created-at: block-height
      })
    (var-set next-resource-id (+ resource-id u1))
    (ok resource-id)))

;; Get session details
(define-read-only (get-session (session-id uint))
  (map-get? integration-sessions { session-id: session-id }))

;; Get support resource
(define-read-only (get-support-resource (resource-id uint))
  (map-get? support-resources { resource-id: resource-id }))
