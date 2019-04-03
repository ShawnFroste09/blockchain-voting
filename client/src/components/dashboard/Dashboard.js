import React from 'react'
import ReactDOM from 'react-dom'
import Web3 from 'web3'
import TruffleContract from 'truffle-contract'
import jwt_decode from 'jwt-decode'
import Election from './contracts/Election.json'
import Content from './Content'
//import 'bootstrap/dist/css/bootstrap.css'

class Dashboard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      account: '0x0',
      candidates: [],
      hasVoted: false,
      loading: true,
      isAdmin: false,
      voting: false,
      contractadd:'0x5D11d56F5ECd1359DC3306758B3f8b68045A562D'
    }

    if (typeof window.web3 !== 'undefined') {
      this.web3Provider = window.web3.currentProvider
    } else {
      this.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545')
    }

    this.web3 = new Web3(this.web3Provider)

    this.election = TruffleContract(Election)
    this.election.setProvider(this.web3Provider)

    this.castVote = this.castVote.bind(this)
    this.watchEvents = this.watchEvents.bind(this)
  }

  componentDidMount() {
    // TODO: Refactor with promise chain
    // this.web3.eth.getCoinbase((err, account) => {
    //   this.setState({ account })
    const token = localStorage.usertoken
    const decoded = jwt_decode(token)
    this.setState({
      account: decoded.pubkey
    })
      
    if (this.state.account == '0x3A234223d328aA95b8811FF16Fe5447A3FAd0951') {
      this.setState({
      isAdmin: true
      })
    }
    
      this.election.deployed().then((electionInstance) => {
        this.electionInstance = electionInstance
        this.watchEvents()
        this.electionInstance.candidatesCount().then((candidatesCount) => {
          for (var i = 1; i <= candidatesCount; i++) {
            this.electionInstance.candidates(i).then((candidate) => {
              const candidates = [...this.state.candidates]
              candidates.push({
                id: candidate[0],
                name: candidate[1],
                voteCount: candidate[2]
              });
              this.setState({ candidates: candidates })
            });
          }
        })
        this.electionInstance.voters(this.state.account).then((hasVoted) => {
          this.setState({ hasVoted, loading: false })
        })
        //console.log(Election.stringify())
      })
    // })
  }

  watchEvents() {
    // TODO: trigger event when vote is counted, not when component renders
    this.electionInstance.votedEvent({}, {
      fromBlock: 0,
      toBlock: 'latest'
    }).watch((error, event) => {
      this.setState({ voting: false })
    })
  }

  castVote(candidateId) {
    this.setState({ voting: true })
    this.electionInstance.vote(candidateId, { from: this.state.account }).then((result) =>
      this.setState({ hasVoted: true })
    )
  }

  render() {
    return (
      <div className='row'>
        <div className='col-lg-12 text-center' >
          <h1>E-Voting</h1>
          <br/>
          { this.state.loading || this.state.voting
            ? <p className='text-center'>Loading...</p>
            : <Content
                account={this.state.account}
                candidates={this.state.candidates}
                hasVoted={this.state.hasVoted}
                castVote={this.castVote}
                contractadd = {this.state.contractadd} />
          }
        </div>
      </div>
    )
  }
}

export default Dashboard;
