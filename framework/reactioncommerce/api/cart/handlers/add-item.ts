import type { CartHandlers } from '..'
import {
  addCartItemsMutation,
  createCartMutation,
} from '@framework/utils/mutations'
import getCartCookie from '@framework/api/utils/get-cart-cookie'
import reconcileCarts from '@framework/api/utils/reconcile-carts'
import {
  REACTION_ANONYMOUS_CART_TOKEN_COOKIE,
  REACTION_CART_ID_COOKIE,
  REACTION_CUSTOMER_TOKEN_COOKIE,
} from '@framework/const'

const addItem: CartHandlers['addItem'] = async ({
  req: { cookies },
  res,
  body: { item },
  config,
}) => {
  const {
    [REACTION_ANONYMOUS_CART_TOKEN_COOKIE]: anonymousCartToken,
    [REACTION_CUSTOMER_TOKEN_COOKIE]: reactionCustomerToken,
  } = cookies

  let { [REACTION_CART_ID_COOKIE]: cartId } = cookies

  if (!cartId) {
    return res.status(400).json({
      data: null,
      errors: [{ message: 'Missing cartId cookie' }],
    })
  }

  if (!item) {
    return res.status(400).json({
      data: null,
      errors: [{ message: 'Missing item' }],
    })
  }
  if (!item.quantity) item.quantity = 1

  if (cartId === config.dummyEmptyCartId) {
    const createdCart = await config.fetch(createCartMutation, {
      variables: {
        input: {
          shopId: config.shopId,
          items: [
            {
              productConfiguration: {
                productId: item.productId,
                productVariantId: item.variantId,
              },
              quantity: item.quantity,
              price: item.pricing,
            },
          ],
        },
      },
    })

    console.log('cart token', createdCart.data.createCart.token)
    console.log('created cart', createdCart.data.createCart.cart)

    res.setHeader('Set-Cookie', [
      getCartCookie(
        config.anonymousCartTokenCookie ?? '',
        createdCart.data.createCart.token,
        999
      ),
      getCartCookie(
        config.cartIdCookie,
        createdCart.data.createCart.cart._id,
        999
      ),
    ])

    return res.status(200).json(createdCart.data)
  }

  const anonymousTokenParam = <any>{}
  const authorizationHeaderParam = <any>{}

  if (anonymousCartToken) {
    anonymousTokenParam.cartToken = anonymousCartToken
  }

  if (reactionCustomerToken) {
    authorizationHeaderParam[
      'Authorization'
    ] = `Bearer ${reactionCustomerToken}`
  }

  if (anonymousCartToken && reactionCustomerToken) {
    ;({ _id: cartId } = await reconcileCarts(config))

    // Clear the anonymous cart token cookie and update cart ID cookie
    res.setHeader('Set-Cookie', [
      getCartCookie(config.anonymousCartTokenCookie ?? ''),
      getCartCookie(config.cartIdCookie, cartId, 999),
    ])
  }

  const updatedCart = await config.fetch(
    addCartItemsMutation,
    {
      variables: {
        input: {
          cartId,
          ...anonymousTokenParam,
          items: [
            {
              productConfiguration: {
                productId: item.productId,
                productVariantId: item.variantId,
              },
              quantity: item.quantity,
              price: item.pricing,
            },
          ],
        },
      },
    },
    {
      headers: {
        ...authorizationHeaderParam,
      },
    }
  )

  console.log('updatedCart', updatedCart)

  return res.status(200).json(updatedCart.data)
}

export default addItem
