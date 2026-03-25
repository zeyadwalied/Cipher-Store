export type Discount = {
  id: string
  name: string
  type: string
  value: number
  isPercentage: boolean
  isActive: boolean
  targetProductId: string | null
  targetCategoryId: string | null
  excludedProductIds: string | null
  excludedCategoryIds: string | null
}

export type ProductWithCategory = {
  id: string
  price: number
  categoryId: string
}

export function calculateDiscount(product: ProductWithCategory, discounts: Discount[]): { finalPrice: number, originalPrice: number, bestDiscount: Discount | null } {
  const originalPrice = product.price
  if (!discounts || discounts.length === 0) {
    return { finalPrice: originalPrice, originalPrice, bestDiscount: null }
  }

  // Filter out discounts that apply to this product
  // Types of automatic discounts: SINGLE, CATEGORY, GENERAL (with exclusions)
  // MIXED is calculated at the Cart level, so we ignore it here for display purposes.

  let applicableDiscounts: Discount[] = []

  for (const discount of discounts) {
    if (!discount.isActive || discount.type === 'MIXED') continue

    let applies = false

    if (discount.type === 'SINGLE' && discount.targetProductId === product.id) {
      applies = true
    } 
    else if (discount.type === 'CATEGORY' && discount.targetCategoryId === product.categoryId) {
      applies = true
    } 
    else if (discount.type === 'GENERAL') {
      let isExcluded = false

      // Check Excluders
      if (discount.excludedProductIds) {
        try {
          const excProd = JSON.parse(discount.excludedProductIds) as string[]
          if (excProd.includes(product.id)) isExcluded = true
        } catch(e) {}
      }
      
      if (!isExcluded && discount.excludedCategoryIds) {
        try {
          const excCat = JSON.parse(discount.excludedCategoryIds) as string[]
          if (excCat.includes(product.categoryId)) isExcluded = true
        } catch(e) {}
      }

      if (!isExcluded) {
        applies = true
      }
    }

    if (applies) {
      applicableDiscounts.push(discount)
    }
  }

  if (applicableDiscounts.length === 0) {
    return { finalPrice: originalPrice, originalPrice, bestDiscount: null }
  }

  // Find the single best discount that results in the lowest price
  let bestDiscount: Discount | null = null
  let lowestPrice = originalPrice

  for (const d of applicableDiscounts) {
    let calculatedPrice = originalPrice
    
    if (d.isPercentage) {
      // 20% value means subtract 20%
      calculatedPrice = originalPrice * (1 - (d.value / 100))
    } else {
      // Fixed value means subtract absolute amount
      calculatedPrice = originalPrice - d.value
    }

    if (calculatedPrice < 0) calculatedPrice = 0 // prevent negative prices

    if (calculatedPrice < lowestPrice) {
      lowestPrice = calculatedPrice
      bestDiscount = d
    }
  }

  return {
    finalPrice: lowestPrice,
    originalPrice,
    bestDiscount
  }
}
