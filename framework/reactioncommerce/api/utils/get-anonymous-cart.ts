import getAnonymousCartQuery from '@framework/utils/queries/get-anonymous-cart'
import { ReactionCommerceConfig } from '@framework/api'
import { setDummyCartCookie } from '@framework/api/endpoints/cart/utils'
import { Cart } from '@framework/schema'

export const getAnonymousCart = async (
  cookies: { [p: string]: string },
  config: ReactionCommerceConfig
) => {
  const {
    data: { cart: rawAnonymousCart },
  } = await config.fetch<{ cart: Cart }>(getAnonymousCartQuery, {
    variables: {
      cartId: cookies[config.cartIdCookie],
      cartToken: cookies[config.anonymousCartTokenCookie ?? ''],
    },
  })

  return rawAnonymousCart
}
