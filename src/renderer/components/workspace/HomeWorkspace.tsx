import BrandLogo from './BrandLogo'
import InputBox from './InputBox'
import QuickPrompts from './QuickPrompts'

export default function HomeWorkspace(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-16">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <BrandLogo />
        <div className="mt-8 w-full">
          <InputBox />
        </div>
        <QuickPrompts />
      </div>
    </div>
  )
}
