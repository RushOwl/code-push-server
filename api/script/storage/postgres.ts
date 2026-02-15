import {Sequelize} from 'sequelize';
import * as stream from "stream";
import * as q from "q";

import Promise = q.Promise;

import * as storage from "./storage";
import { Account, initAccountModel } from '../models/account';


export class PostgresStorage {
  private sequelize: Sequelize;

  constructor() {
    this.sequelize = new Sequelize('database', 'username', 'password', {
      host: 'localhost',
      port: 5432,
      dialect: 'postgres',
    });

    this.connect();
    this.initModels();
  }

  private connect() {
    return this.sequelize.authenticate();
  }

  private initModels() {
    initAccountModel(this.sequelize);
  }

  public checkHealth(): Promise<void> {
    return q(<void>null);
  }

  public async addAccount(account: storage.Account): globalThis.Promise<string> {
    const newAccount = new Account({
      email: account.email.toLowerCase(),
      gitHubId: account.gitHubId,
    })
    try {
      const existingAccount = await Account.findOne({
        where: {
          email: newAccount.email,
        },
      })
      if (!!existingAccount) {
        return PostgresStorage.getRejectedPromise(storage.ErrorCode.AlreadyExists)
      }
      await newAccount.save()
      return q(`${newAccount.id}`)
    } catch (error) {
      return PostgresStorage.getRejectedPromise(storage.ErrorCode.ConnectionFailed)
    }
  }

  public getAccount(accountId: string): Promise<storage.Account> {
    return q.resolve(null)
  }
  public getAccountByEmail(email: string): Promise<storage.Account> {
    return q.resolve(null)
  }
  public getAccountIdFromAccessKey(accessKey: string): Promise<string> {
    return q.resolve('')
  }
  public updateAccount(email: string, updates: storage.Account): Promise<void> {
    return q.resolve()
  }

  public addApp(accountId: string, app: storage.App): Promise<storage.App> {
    return q.resolve(null)
  }
  public getApps(accountId: string): Promise<storage.App[]> {
    return q.resolve([])
  }
  public getApp(accountId: string, appId: string): Promise<storage.App> {
    return q.resolve(null)
  }
  public removeApp(accountId: string, appId: string): Promise<void> {
    return q.resolve()
  }
  public transferApp(accountId: string, appId: string, email: string): Promise<void> {
    return q.resolve()
  }
  public updateApp(accountId: string, app: storage.App): Promise<void> {
    return q.resolve()
  }

  public addCollaborator(accountId: string, appId: string, email: string): Promise<void> {
    return q.resolve()
  }
  public getCollaborators(accountId: string, appId: string): Promise<storage.CollaboratorMap> {
    return q.resolve(null)
  }
  public removeCollaborator(accountId: string, appId: string, email: string): Promise<void> {
    return q.resolve()
  }

  public addDeployment(accountId: string, appId: string, deployment: storage.Deployment): Promise<string> {
    return q.resolve('')
  }
  public getDeployment(accountId: string, appId: string, deploymentId: string): Promise<storage.Deployment> {
    return q.resolve(null)
  }
  public getDeploymentInfo(deploymentKey: string): Promise<storage.DeploymentInfo> {
    return q.resolve(null)
  }
  public getDeployments(accountId: string, appId: string): Promise<storage.Deployment[]> {
    return q.resolve([])
  }
  public removeDeployment(accountId: string, appId: string, deploymentId: string): Promise<void> {
    return q.resolve()
  }
  public updateDeployment(accountId: string, appId: string, deployment: storage.Deployment): Promise<void> {
    return q.resolve()
  }

  public commitPackage(accountId: string, appId: string, deploymentId: string, appPackage: storage.Package): Promise<storage.Package> {
    return q.resolve(null)
  }
  public clearPackageHistory(accountId: string, appId: string, deploymentId: string): Promise<void> {
    return q.resolve()
  }
  public getPackageHistoryFromDeploymentKey(deploymentKey: string): Promise<storage.Package[]> {
    return q.resolve([])
  }
  public getPackageHistory(accountId: string, appId: string, deploymentId: string): Promise<storage.Package[]> {
    return q.resolve(null)
  }
  public updatePackageHistory(accountId: string, appId: string, deploymentId: string, history: storage.Package[]): Promise<void> {
    return q.resolve()
  }

  public addBlob(blobId: string, addstream: stream.Readable, streamLength: number): Promise<string> {
    return q.resolve('')
  }
  public getBlobUrl(blobId: string): Promise<string> {
    return q.resolve('')
  }
  public removeBlob(blobId: string): Promise<void> {
    return q.resolve()
  }

  public addAccessKey(accountId: string, accessKey: storage.AccessKey): Promise<string> {
    return q.resolve('')
  }
  public getAccessKey(accountId: string, accessKeyId: string): Promise<storage.AccessKey> {
    return q.resolve(null)
  }
  public getAccessKeys(accountId: string): Promise<storage.AccessKey[]> {
    return q.resolve([])
  }
  public removeAccessKey(accountId: string, accessKeyId: string): Promise<void> {
    return q.resolve()
  }
  public updateAccessKey(accountId: string, accessKey: storage.AccessKey): Promise<void> {
    return q.resolve()
  }

  public dropAll(): Promise<void> {
    return q.resolve();
  }

  private static getRejectedPromise(errorCode: storage.ErrorCode, message?: string): Promise<any> {
    return q.reject(storage.storageError(errorCode, message));
  }
}