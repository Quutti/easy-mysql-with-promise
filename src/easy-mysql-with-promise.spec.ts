
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as Promise from 'bluebird';

import { MysqlConnection } from './easy-mysql-with-promise';

const connectionMock: any = {
    query(query, params, cb): any { cb(null, {}) },
    release(): any { }
};

const mysqlPoolMock: any = {
    getConnection(cb): any { cb(null, connectionMock); },
    query(): any { }
}

const mysqlMock: any = {
    createPool(): any { return mysqlPoolMock; },
};

describe("Package: easy-mysql-with-promise", () => {

    describe("Class: MysqlConnection", () => {

        let mysqlConn, settings;

        beforeEach(() => {
            settings = {
                host: 'localhost',
                port: 5555,
                connectionLimit: 5,
                user: '',
                password: '',
                database: ''
            };
        });

        describe("Constructing", () => {

            it("should call mysql :s createPool method with settings ", () => {
                let spy = sinon.spy(mysqlMock, 'createPool');
                let mysqlConn = new MysqlConnection(settings, mysqlMock);

                expect(spy.calledWith(settings)).to.be.true;

                spy.restore();
            })

            it("should default host, port and connectionLimit", () => {
                settings.host = undefined;
                settings.port = undefined;
                settings.connectionLimit = undefined;

                let spy = sinon.spy(mysqlMock, 'createPool');
                let mysqlConn = new MysqlConnection(settings, mysqlMock);

                expect(spy.args[0][0].host).to.eq('localhost');
                expect(spy.args[0][0].port).to.eq(3306);
                expect(spy.args[0][0].connectionLimit).to.be.greaterThan(0);

                spy.restore();
            });

        });

        describe("Methods", () => {

            beforeEach(() => mysqlConn = new MysqlConnection(settings, mysqlMock));

            describe("Method: query", () => {

                const TEST_QUERY = 'SELECT * FROM test';

                let stub, spy;

                beforeEach(() => {
                    stub = null;
                    spy = null;
                });

                afterEach(() => {
                    if (spy) {
                        spy.restore();
                    }
                    if (stub) {
                        stub.restore();
                    }
                })

                it("should return a Promise", () => {
                    expect(mysqlConn.query("SELECT * FROM test", []) instanceof Promise).to.be.true;
                });

                it("should call connections query method with passed arguments", (done) => {
                    spy = sinon.spy(connectionMock, 'query');
                    mysqlConn.query(TEST_QUERY, [])
                        .then(() => {
                            expect(spy.calledWith(TEST_QUERY, [])).to.be.true;
                            done();
                        })
                        .catch(err => done(err));
                });

                it("should call release acquired connection", (done) => {
                    spy = sinon.spy(connectionMock, 'release');
                    mysqlConn.query(TEST_QUERY, [])
                        .then(() => {
                            expect(spy.called).to.be.true;
                            done();
                        })
                        .catch(err => done(err));
                });

                it("should return resolved promise if query has no errors", (done) => {
                    const RES_STRING = "A RESULT!";

                    stub = sinon.stub(connectionMock, 'query').callsFake((query, params, cb) => cb(null, RES_STRING));
                    mysqlConn.query(TEST_QUERY, [])
                        .then(res => {
                            expect(res).to.eq(RES_STRING);
                            done();
                        })
                        .catch(err => done(err));
                });

                it("should return rejected promise if connection has error", (done) => {
                    const ERROR_STRING = "AN ERROR MONSTER!";

                    stub = sinon.stub(mysqlPoolMock, 'getConnection').callsFake(cb => cb(ERROR_STRING, null));
                    let prom: Promise<any> = mysqlConn.query(TEST_QUERY, [])
                        .then(() => {
                            throw 'continue';
                        })
                        .catch(err => {
                            expect(err).to.eq(ERROR_STRING);
                            done();
                        });
                });

                it("should return rejected promise if query has error", (done) => {
                    const ERROR_STRING = "AN ANOTHER ERROR MONSTER!";

                    stub = sinon.stub(connectionMock, 'query').callsFake((query, params, cb) => cb(ERROR_STRING, null));
                    let prom: Promise<any> = mysqlConn.query(TEST_QUERY, [])
                        .then(() => {
                            throw 'continue';
                        })
                        .catch(err => {
                            expect(err).to.eq(ERROR_STRING);
                            done();
                        });
                });

            });

        });

    });

});