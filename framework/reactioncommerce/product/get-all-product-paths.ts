import { ReactionCommerceConfig } from '../api'
import fetchAllProducts from '../api/utils/fetch-all-products'
import getAllProductsPathsQuery from '../utils/queries/get-all-products-paths-query'
import commerce from '@lib/api/commerce'

type ProductPath = {
  path: string
}

export type ProductPathNode = {
  node: ProductPath
}

type ReturnType = {
  products: ProductPathNode[]
}

const getAllProductPaths = async (options?: {
  variables?: any
  config?: ReactionCommerceConfig
  preview?: boolean
}): Promise<ReturnType> => {
  let { config, variables = { first: 250 } } = options ?? {}
  config = commerce.getConfig(config)

  const products = await fetchAllProducts({
    config,
    query: getAllProductsPathsQuery,
    variables: {
      ...variables,
      shopIds: [config.shopId],
    },
  })

  return {
    products: products?.map(
      ({
        node: {
          product: { slug },
        },
      }: any) => ({
        node: {
          path: `/${slug}`,
        },
      })
    ),
  }
}

export default getAllProductPaths
