export type BaseApiResponse = {
  status: string
  message: string
}

export type LoginResponse = BaseApiResponse & {
  data: {
    authorization: {
      type: string
      token: string
    }
  }
}
