import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { TransferBetweenAccountsUseCase } from "./TransferBetweenAccountsUseCase";
import { TransferBetweenAccountsError } from "./TransferBetweenAccountsError";
import { OperationType } from "../../entities/Statement";

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryStatementsRepository: InMemoryStatementsRepository
let transferBetweenAccountsUseCase: TransferBetweenAccountsUseCase

describe('Transfer Between Accounts', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryStatementsRepository = new InMemoryStatementsRepository()
    transferBetweenAccountsUseCase = new TransferBetweenAccountsUseCase(inMemoryStatementsRepository, inMemoryUsersRepository);
  })

  it('should be able to transfer an amount between accounts', async () => {
    const sender = await inMemoryUsersRepository.create({
      name: 'Gustavo Matei',
      email: 'gustavo.matei@gustavo.com',
      password: 'GustavoMatei'
    })

    await inMemoryStatementsRepository.create({
      user_id: String(sender.id),
      description: 'A Deposit for test',
      amount: 900,
      type: OperationType.DEPOSIT
    })

    const recipient = await inMemoryUsersRepository.create({
      name: 'Gustavo Oliveira',
      email: 'gustavo.oliveira@gustavo.com',
      password: 'GustavoOliveira'
    })

    const transfer = await transferBetweenAccountsUseCase.execute({
      sender_id: String(sender.id),
      user_id: String(recipient.id),
      description: 'A Transfer for Test',
      amount: 800
    })

    expect(transfer).toHaveProperty('id')
    expect(transfer.amount).toBe(800)
    expect(transfer.sender_id).toBe(sender.id)
    expect(transfer.user_id).toBe(recipient.id)
  })

  it('should not be able to transfer if the sender does not exists', async () => {
    const recipient = await inMemoryUsersRepository.create({
      name: 'Gustavo Oliveira',
      email: 'gustavo.oliveira@gustavo.com',
      password: 'GustavoOliveira'
    })

    await expect(
      transferBetweenAccountsUseCase.execute({
        sender_id: 'non-existent-sender',
        user_id: String(recipient.id),
        description: 'A Transfer for Test',
        amount: 800
      })
    ).rejects.toBeInstanceOf(TransferBetweenAccountsError.SenderNotFound)
  })

  it('should not be able to transfer if the recipient does not exists', async () => {
    const sender = await inMemoryUsersRepository.create({
      name: 'Gustavo Matei',
      email: 'gustavo.matei@gustavo.com',
      password: 'GustavoMatei'
    })

    await expect(
      transferBetweenAccountsUseCase.execute({
        sender_id: String(sender.id),
        user_id: 'non-existent-recipient',
        description: 'A Transfer for Test',
        amount: 800
      })
    ).rejects.toBeInstanceOf(TransferBetweenAccountsError.RecipientNotFound)
  })

  it('should not be able to transfer if the recipient and sender are the same user', async () => {
    const same_user = await inMemoryUsersRepository.create({
      name: 'Gustavo Matei',
      email: 'gustavo.matei@gustavo.com',
      password: 'GustavoMatei'
    })

    await expect(
      transferBetweenAccountsUseCase.execute({
        sender_id: String(same_user.id),
        user_id: String(same_user.id),
        description: 'A Transfer for Test',
        amount: 800
      })
    ).rejects.toBeInstanceOf(TransferBetweenAccountsError.TransferRequiresDifferentUsers)
  })

  it('should not be able to transfer if the amount is greater than balance of sender', async () => {
    const sender = await inMemoryUsersRepository.create({
      name: 'Gustavo Matei',
      email: 'gustavo.matei@gustavo.com',
      password: 'GustavoMatei'
    })

    const recipient = await inMemoryUsersRepository.create({
      name: 'Gustavo Oliveira',
      email: 'gustavo.oliveira@gustavo.com',
      password: 'GustavoOliveira'
    })

    await inMemoryStatementsRepository.create({
      user_id: String(sender.id),
      description: 'A Deposit for test',
      amount: 400,
      type: OperationType.DEPOSIT
    })

    await expect(
      transferBetweenAccountsUseCase.execute({
        sender_id: String(sender.id),
        user_id: String(recipient.id),
        description: 'A Transfer for Test',
        amount: 800
      })
    ).rejects.toBeInstanceOf(TransferBetweenAccountsError.InsufficientFunds)
  })
})
