;; Coach Verification Contract
;; Validates and manages consciousness transformation coaches

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_COACH_EXISTS (err u101))
(define-constant ERR_COACH_NOT_FOUND (err u102))
(define-constant ERR_INVALID_CREDENTIALS (err u103))

;; Coach data structure
(define-map coaches
  { coach-id: principal }
  {
    name: (string-ascii 100),
    credentials: (string-ascii 200),
    specialization: (string-ascii 100),
    experience-years: uint,
    verified: bool,
    rating: uint,
    total-clients: uint,
    created-at: uint
  }
)

;; Coach verification status
(define-map verification-requests
  { coach-id: principal }
  {
    status: (string-ascii 20),
    submitted-at: uint,
    reviewed-at: (optional uint),
    reviewer: (optional principal)
  }
)

;; Register as a coach
(define-public (register-coach
  (name (string-ascii 100))
  (credentials (string-ascii 200))
  (specialization (string-ascii 100))
  (experience-years uint))
  (let ((coach-id tx-sender))
    (asserts! (is-none (map-get? coaches { coach-id: coach-id })) ERR_COACH_EXISTS)
    (map-set coaches
      { coach-id: coach-id }
      {
        name: name,
        credentials: credentials,
        specialization: specialization,
        experience-years: experience-years,
        verified: false,
        rating: u0,
        total-clients: u0,
        created-at: block-height
      })
    (map-set verification-requests
      { coach-id: coach-id }
      {
        status: "pending",
        submitted-at: block-height,
        reviewed-at: none,
        reviewer: none
      })
    (ok coach-id)))

;; Verify a coach (admin only)
(define-public (verify-coach (coach-id principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (is-some (map-get? coaches { coach-id: coach-id })) ERR_COACH_NOT_FOUND)
    (map-set coaches
      { coach-id: coach-id }
      (merge (unwrap-panic (map-get? coaches { coach-id: coach-id }))
             { verified: true }))
    (map-set verification-requests
      { coach-id: coach-id }
      (merge (unwrap-panic (map-get? verification-requests { coach-id: coach-id }))
             { status: "approved", reviewed-at: (some block-height), reviewer: (some tx-sender) }))
    (ok true)))

;; Get coach information
(define-read-only (get-coach (coach-id principal))
  (map-get? coaches { coach-id: coach-id }))

;; Check if coach is verified
(define-read-only (is-coach-verified (coach-id principal))
  (match (map-get? coaches { coach-id: coach-id })
    coach-data (get verified coach-data)
    false))

;; Update coach rating
(define-public (update-coach-rating (coach-id principal) (new-rating uint))
  (begin
    (asserts! (is-some (map-get? coaches { coach-id: coach-id })) ERR_COACH_NOT_FOUND)
    (asserts! (<= new-rating u5) ERR_INVALID_CREDENTIALS)
    (map-set coaches
      { coach-id: coach-id }
      (merge (unwrap-panic (map-get? coaches { coach-id: coach-id }))
             { rating: new-rating }))
    (ok true)))
