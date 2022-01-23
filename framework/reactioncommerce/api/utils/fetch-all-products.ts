import { ProductEdge } from '../../schema'
import { ReactionCommerceConfig } from '..'

const fetchAllProducts = async ({
  config,
  query,
  variables,
  acc = [],
  cursor,
}: {
  config: ReactionCommerceConfig
  query: string
  acc?: ProductEdge[]
  variables?: any
  cursor?: string
}): Promise<ProductEdge[]> => {
  const { data } = await config.fetch(query, {
    variables: { ...variables, cursor },
  })

  const edges: ProductEdge[] = data.catalogItems?.edges ?? []
  const hasNextPage = data.catalogItems?.pageInfo?.hasNextPage
  acc = acc.concat(edges)

  if (hasNextPage) {
    const cursor = edges.pop()?.cursor
    if (cursor) {
      return fetchAllProducts({
        config,
        query,
        variables,
        acc,
        cursor,
      })
    }
  }

  return acc
}

export default fetchAllProducts
