import React, { FC } from 'react'
import useStepper, { Step as CheckoutStep } from '@hooks/useStepper'
import { Cart, LineItem } from '@framework/types/cart'
import Fade from '@mui/material/Fade'
import CartItem from '@components/cart/CartItem'
import CartSummary from '@components/cart/CartSummary/CartSummary'
import { Button, Container } from '@components/ui'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stepper from '@mui/material/Stepper'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import Step from '@mui/material/Step'

interface DesktopCheckoutProps {
  cart: Cart
  steps: CheckoutStep[]
  isLoading: boolean
}

const DesktopCheckout: FC<DesktopCheckoutProps> = ({
  cart,
  steps,
  isLoading,
}) => {
  const {
    activeStep,
    isActiveStepLoading,
    isLastStep,
    handleBack,
    handleNext,
    canContinueToNextStep,
    renderStepComponent,
  } = useStepper(steps)

  return (
    <Container className="flex flex-1 w-full justify-center">
      <section className="flex-1 mr-4 max-w-6xl">
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel StepIconComponent={() => <div>{step.icon}</div>}>
                <Typography variant="h5" className="font-bold">
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                {renderStepComponent(index)}
                <div className="mt-4">
                  <Button
                    className="mr-4"
                    size="slim"
                    onClick={handleBack}
                    disabled={activeStep === 0}
                  >
                    Назад
                  </Button>
                  <Button
                    size="slim"
                    loading={isActiveStepLoading}
                    onClick={handleNext}
                    disabled={!canContinueToNextStep()}
                  >
                    {!isLastStep() ? 'Продължи' : 'Завърши'}
                  </Button>
                </div>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </section>
      <aside>
        <Card
          className="max-w-sm w-96 shadow-sm border border-accents-3 mt-12"
          elevation={0}
        >
          <CardContent>
            <div className="flex flex-col">
              <div className="px-4 sm:px-6 flex-1">
                <Fade in={!isLoading}>
                  <ul>
                    {cart?.lineItems.map((item: LineItem) => (
                      <CartItem
                        key={item.id}
                        variant="slim"
                        item={item}
                        currencyCode={cart?.currency.code!}
                      />
                    ))}
                  </ul>
                </Fade>
              </div>
              <div className="flex-shrink-0 px-4 pt-24 lg:pt-10 sm:px-6">
                <CartSummary cart={cart} />
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </Container>
  )
}

export default DesktopCheckout
