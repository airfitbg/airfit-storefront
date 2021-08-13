import { useCallback } from 'react'

import type {
  MutationHookContext,
  HookFetcherContext,
} from '@commerce/utils/types'

import { ValidationError } from '@commerce/utils/errors'

import useCart from './use-cart'
import { removeCartItemsMutation, normalizeCart } from '../utils'
import { LineItem, RemoveItemHook } from '../types'
import { Mutation, MutationUpdateCartItemsQuantityArgs } from '../schema'
import useRemoveItem, { UseRemoveItem } from '@commerce/cart/use-remove-item'
import { getCartIdCookie } from '@framework/utils/get-cart-id-cookie'
import { getAnonymousCartToken } from '@framework/utils/anonymous-cart-token'

export default useRemoveItem as UseRemoveItem<typeof handler>

export const handler = {
  fetchOptions: {
    query: removeCartItemsMutation,
  },
  async fetcher({
    input: { itemId },
    options,
    fetch,
  }: HookFetcherContext<RemoveItemHook>) {
    const { removeCartItems } = await fetch<
      Mutation,
      MutationUpdateCartItemsQuantityArgs
    >({
      ...options,
      variables: {
        input: {
          cartId: getCartIdCookie(),
          cartToken: getAnonymousCartToken(),
          cartItemIds: [itemId],
        },
      },
    })
    return normalizeCart(removeCartItems?.cart)
  },
  useHook:
    ({ fetch }: MutationHookContext<RemoveItemHook>) =>
    <T extends LineItem | undefined = undefined>() => {
      const { mutate } = useCart()

      return useCallback(
        async (input) => {
          const itemId = input?.id

          if (!itemId) {
            throw new ValidationError({
              message: 'Invalid input used for this operation',
            })
          }

          const data = await fetch({ input: { itemId } })
          await mutate(data, false)
          return data
        },
        [fetch, mutate]
      )
    },
}
