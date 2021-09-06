import React, { FC, useEffect, useState } from 'react'
import { Button, Container, Input, Logo, Text } from '@components/ui'
import SwipeableViews from 'react-swipeable-views'
import { ShippingAddressForm } from '@components/checkout/ShippingAddressForm/ShippingAddressForm'
import { PaymentForm } from '@components/checkout/PaymentForm/PaymentForm'
import { Drawer, MobileStepper } from '@material-ui/core'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import s from './CheckoutView.module.scss'
import { CartView } from '@components/cart/CartView/CartView'
import {
  Cart,
  OrderFulfillmentGroupInput,
  OrderInput,
  PaymentInput,
} from '@framework/schema'
import { FieldErrors, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { UseFormRegister } from 'react-hook-form/dist/types/form'
import { AddressInput, PaymentMethod } from '@framework/schema'
import Link from '@components/ui/Link'
import placeOrder from '@lib/reactioncommerce/utils/placeOrder'
import { normalizeCart } from '@framework/utils'

interface CheckoutViewProps {
  cart: Cart | null | undefined
  isLoading: boolean
  isEmpty: boolean
  mutationQueries: {
    setShippingAddress: (address: Partial<AddressInput>) => Promise<void>
    setFulfillmentOption: (
      fulfillmentGroupId: string,
      fulfillmentMethodId: string
    ) => Promise<void>
  }
  paymentMethods: PaymentMethod[]
}

interface UserDataFieldValues {
  firstName: string
  sureName: string
  phone: number
  email: string
}

export interface ShippingAddressFieldValues {
  address: string
  locality: string
  postalCode: string
}

const userDataFormSchema = yup.object().shape({
  firstName: yup.string().required('Задължително поле'),
  sureName: yup.string().required('Задължително поле'),
  phone: yup.number().required('Задължително поле'),
  email: yup
    .string()
    .email('Въведете валиден мейл')
    .required('Задължително поле'),
})

export const CheckoutView: FC<CheckoutViewProps> = ({
  cart,
  isLoading,
  isEmpty,
  mutationQueries,
  paymentMethods,
}) => {
  const [activeStep, setActiveStep] = useState(0)
  const [readyToFinalize, setReadyToFinalize] = useState(false)
  const [cartOpened, setCartOpened] = useState(false)
  const [continueButtonLoading, setContinueButtonLoading] = useState(false)

  const {
    register: userDataRegister,
    getValues: userDataGetValues,
    formState: { errors: userDataErrors, isValid: userDataIsValid },
  } = useForm<UserDataFieldValues>({
    resolver: yupResolver(userDataFormSchema),
    mode: 'all',
  })

  const {
    register: shippingAddressRegister,
    getValues: shippingAddressGetValues,
    setValue: shippingAddressSetValue,
    formState: {
      errors: shippingAddressErrors,
      isValid: shippingAddressIsValid,
    },
  } = useForm<ShippingAddressFieldValues>({ mode: 'all' })

  const [payment, setPayment] = useState<PaymentMethod | undefined>(undefined)

  const handleNext = async () => {
    if (continueButtonLoading) return

    switch (activeStep) {
      case 1:
        setContinueButtonLoading(true)
        await handleSetShippingAddress()
        setContinueButtonLoading(false)
        break
      case 2:
        setContinueButtonLoading(true)
        await handlePlaceOrder()
        setContinueButtonLoading(false)
        break
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleOpenCart = () => {
    setCartOpened(true)
  }

  const handleCloseCart = () => {
    setCartOpened(false)
  }

  useEffect(() => {
    activeStep === 2 ? setReadyToFinalize(true) : setReadyToFinalize(false)
  }, [activeStep])

  const canContinueNextStep = (pageIndex: number): boolean => {
    switch (pageIndex) {
      case 0:
        return userDataIsValid
      case 1:
        return shippingAddressIsValid
      case 2:
        return !!payment
    }
    return false
  }

  const handleSetShippingAddress = async () => {
    await mutationQueries.setShippingAddress({
      phone: userDataGetValues('phone').toString(),
      firstName: userDataGetValues('firstName'),
      lastName: userDataGetValues('sureName'),
      fullName: `${userDataGetValues('firstName')} ${userDataGetValues(
        'sureName'
      )}`,
      address1: shippingAddressGetValues('address'),
      city: shippingAddressGetValues('locality'),
      region: shippingAddressGetValues('locality'),
      country: 'България',
      postal: shippingAddressGetValues('postalCode'),
    })
    await mutationQueries.setFulfillmentOption(
      cart!.checkout!.fulfillmentGroups[0]!._id,
      cart!.checkout!.fulfillmentGroups[0]!.availableFulfillmentOptions[0]!
        .fulfillmentMethod!._id
    )
  }

  const handlePlaceOrder = async () => {
    const orderInput = buildOrder()

    if (!orderInput) return

    await placeOrder({
      order: orderInput as OrderInput,
      payments: [
        {
          amount: cart?.checkout?.summary.total.amount ?? 0,
          method: payment!.name,
        } as PaymentInput,
      ],
    })
  }

  const buildOrder = (): Partial<OrderInput> | undefined => {
    if (!cart) return

    const { checkout } = cart

    const fulfillmentGroups = checkout!.fulfillmentGroups!.map((group) => {
      const { data, selectedFulfillmentOption } = group!

      const items = cart.items!.edges!.map((edge) => {
        const item = edge!.node

        return {
          addedAt: item!.addedAt,
          price: item!.price.amount,
          productConfiguration: item!.productConfiguration,
          quantity: item!.quantity,
        }
      })

      return {
        data,
        items,
        selectedFulfillmentMethodId:
          selectedFulfillmentOption!.fulfillmentMethod!._id,
        shopId: group!.shop._id,
        totalPrice: checkout!.summary.total.amount,
        type: group!.type,
      }
    })

    return {
      cartId: cart._id,
      currencyCode: checkout!.summary.total.currency.code,
      email: userDataGetValues('email'),
      fulfillmentGroups: fulfillmentGroups as OrderFulfillmentGroupInput[],
      shopId: cart.shop._id,
    }
  }

  return (
    <Container className={s.root}>
      <div className={s.header}>
        <div className={s.logo}>
          <Link href="/">
            <Logo reversedColor={true} />
          </Link>
        </div>
        <div className={s.gradientLine} />
      </div>
      <SwipeableViews
        className="flex-1"
        index={activeStep}
        disabled={true}
        animateHeight={true}
      >
        <div className="flex flex-1 flex-col space-y-4">
          <Text variant="pageHeading">🧑‍🚀 Данни за клиента</Text>
          <UserDataForm register={userDataRegister} errors={userDataErrors} />
        </div>
        <div>
          <Text variant="pageHeading">📦 Адрес за доставка</Text>
          <ShippingAddressForm
            register={shippingAddressRegister}
            errors={shippingAddressErrors}
            setValue={shippingAddressSetValue}
          />
        </div>
        <div>
          <Text variant="pageHeading">💵 Метод за плащане</Text>
          <PaymentForm
            availablePaymentMethods={paymentMethods}
            setPaymentMethod={setPayment}
          />
        </div>
      </SwipeableViews>
      <section className="my-6">
        <div className="border-t border-accents-2">
          <ul className="py-3">
            <li className="flex justify-between py-1">
              <span>Доставка</span>
              <span className="font-bold tracking-wide">БЕЗПЛАТНА</span>
            </li>
          </ul>
          <div className="flex justify-between border-t border-accents-2 py-3 font-bold mb-2">
            <span>Общо</span>
            <span>
              {cart?.checkout?.summary.total.displayAmount ?? '0.00 лв.'}
            </span>
          </div>
        </div>
        <Button
          className="w-full justify-between mb-12"
          variant="slim"
          color="secondary"
          onClick={handleOpenCart}
        >
          <span className="flex-1 font-light">🛒 Преглед на количката</span>
          <ExpandLessIcon />
        </Button>
      </section>
      <MobileStepper
        variant="progress"
        steps={3}
        position="bottom"
        elevation={10}
        activeStep={activeStep}
        nextButton={
          <Button
            className="ml-4 mr-2"
            variant="slim"
            loading={continueButtonLoading}
            onClick={handleNext}
            disabled={activeStep === 3 || !canContinueNextStep(activeStep)}
          >
            {!readyToFinalize ? 'Продължи' : 'Завърши'}
          </Button>
        }
        backButton={
          <Button
            className="ml-2 mr-4"
            variant="slim"
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Назад
          </Button>
        }
      />

      <Drawer
        anchor="bottom"
        open={cartOpened}
        onClose={handleCloseCart}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <div className={s.cartDrawerContent}>
          <CartView
            data={normalizeCart(cart!)}
            isEmpty={isEmpty}
            isLoading={isLoading}
            checkoutButton={false}
            onClose={handleCloseCart}
          />
        </div>
      </Drawer>
    </Container>
  )
}

interface UserDataFormProps {
  register: UseFormRegister<UserDataFieldValues>
  errors: FieldErrors<UserDataFieldValues>
}

const UserDataForm: FC<UserDataFormProps> = ({ register, errors }) => {
  return (
    <>
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-3">
        <Input
          register={register}
          label="firstName"
          error={errors.firstName}
          type="text"
          placeholder="Име"
        />
        <Input
          register={register}
          label="sureName"
          error={errors.sureName}
          type="text"
          placeholder="Фамилия"
        />
      </div>
      <Input
        register={register}
        type="tel"
        label="phone"
        error={errors.phone}
        placeholder="Телефонен номер"
      />
      <Input
        register={register}
        type="email"
        label="email"
        error={errors.email}
        placeholder="Емейл"
      />
    </>
  )
}
