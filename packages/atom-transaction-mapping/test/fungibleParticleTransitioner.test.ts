import {
	makeSimpleTransitioner,
	makeTransitioner,
} from '../src/fungibleParticleTransitioner'
import {
	AnySpunParticle,
	ParticleBase,
	Spin,
	spunDownParticle,
	SpunParticle,
	spunUpParticle,
} from '@radixdlt/atom'
import { Amount, amountInSmallestDenomination } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { v4 as uuidv4 } from 'uuid'
import { exactlyContainParticles } from '../../atom/test/helpers/particles'

describe('fungibleParticleTransitioner', () => {
	const one = amountInSmallestDenomination(UInt256.valueOf(1))
	const two = amountInSmallestDenomination(UInt256.valueOf(2))
	const nine = amountInSmallestDenomination(UInt256.valueOf(9))
	const ten = amountInSmallestDenomination(UInt256.valueOf(10))
	const eleven = amountInSmallestDenomination(UInt256.valueOf(11))

	type TestParticle = ParticleBase & {
		amount: Amount
		id: string
		isChangeReturnedToSender: boolean
	}

	const testParticle = (
		amount: number | Amount,
		id?: string,
		isChangeReturnedToSender?: boolean,
	): TestParticle => {
		const id_ = id ?? uuidv4()
		const amount_ =
			typeof amount === 'number'
				? amountInSmallestDenomination(UInt256.valueOf(amount))
				: amount
		return {
			amount: amount_,
			id: id_,
			isChangeReturnedToSender: isChangeReturnedToSender ?? false,
			equals: (other) => (other as TestParticle).id === id_,
		}
	}

	const transitioner = makeSimpleTransitioner<TestParticle, TestParticle>({
		inputAmountMapper: (p) => p.amount,
		inputCreator: (amount) => /* From */ testParticle(amount),
		outputCreator: (amount) => /* To */ testParticle(amount),
	})

	it('should create a transition with two particles is output when TWO to 2', () => {
		const particle = testParticle(2)
		const spunParticles = transitioner
			.transition({
				currentParticles: [particle],
				totalAmountToTransfer: two,
			})
			._unsafeUnwrap()

		expect(spunParticles.length).toBe(2)

		const spunParticle0 = spunParticles[0]
		expect(spunParticle0.particle.equals(particle)).toBe(true)
		expect(spunParticle0.spin).toBe(Spin.DOWN)

		const spunParticle1 = spunParticles[1]
		expect(spunParticle1.spin).toBe(Spin.UP)
		expect(spunParticle1.particle.equals(particle)).toBe(false)
		expect(
			(spunParticle1.particle as TestParticle).amount.equals(two),
		).toBe(true)
	})

	type SpunTestParticle = SpunParticle<TestParticle>
	const upTP = (tp: TestParticle): SpunTestParticle => spunUpParticle(tp)
	const downTP = (tp: TestParticle): SpunTestParticle => spunDownParticle(tp)

	const expectTransition = (
		input: Readonly<{
			actual: AnySpunParticle[]
			expected: SpunTestParticle[]
		}>,
	): void => {
		const match = exactlyContainParticles({
			actual: input.actual,
			expected: input.expected.map((p) => p.eraseToAny()),
		})

		expect(match).toBe(true)
	}

	it('should work with many particle and change', () => {
		const outCounter = 0
		const transitioner = makeTransitioner<TestParticle, TestParticle>({
			inputAmountMapper: (p) => p.amount,
			inputCreator: (amount, from: TestParticle) =>
				/* From */ testParticle(amount, from.id.toUpperCase(), true),
			outputCreator: (amount) =>
				/* To */ testParticle(amount, `up${outCounter}`),
		})

		const a = testParticle(1, 'a')
		const b = testParticle(2, 'b')
		const c = testParticle(3, 'c')
		const d = testParticle(4, 'd')

		const spunParticles = transitioner
			.transition({
				currentParticles: [a, b, c, d],
				totalAmountToTransfer: nine,
			})
			._unsafeUnwrap()

		expectTransition({
			actual: spunParticles,
			expected: [
				upTP(testParticle(nine, 'up0', false)),
				downTP(a),
				downTP(b),
				downTP(c),
				downTP(d),
				upTP(testParticle(one, 'D', true)),
			],
		})
	})

	it('should work with many particle and no change', () => {
		const transitioner = makeTransitioner<TestParticle, TestParticle>({
			inputAmountMapper: (p) => p.amount,
			inputCreator: (amount, from: TestParticle) =>
				/* From */ testParticle(amount, from.id.toUpperCase()),
			outputCreator: (amount) => /* To */ testParticle(amount, `up0`),
		})

		const a = testParticle(1, 'a')
		const b = testParticle(2, 'b')
		const c = testParticle(3, 'c')
		const d = testParticle(4, 'd')

		const spunParticles = transitioner
			.transition({
				currentParticles: [a, b, c, d],
				totalAmountToTransfer: ten,
			})
			._unsafeUnwrap()

		expectTransition({
			actual: spunParticles,
			expected: [
				upTP(testParticle(nine, 'up0')),
				downTP(a),
				downTP(b),
				downTP(c),
				downTP(d),
			],
		})
	})

	it('should fail if insufficient funds with single particle', () => {
		const particle = testParticle(1)
		const transitionResult = transitioner.transition({
			currentParticles: [particle],
			totalAmountToTransfer: two,
		})

		transitionResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(e) => expect(e.message).toBe(`Insufficient balance.`),
		)
	})

	it('should fail if insufficient funds with many particle', () => {
		const transitionResult = transitioner.transition({
			currentParticles: [
				testParticle(1),
				testParticle(2),
				testParticle(3),
				testParticle(4),
			],
			totalAmountToTransfer: eleven,
		})

		transitionResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(e) => expect(e.message).toBe(`Insufficient balance.`),
		)
	})
})
