import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.webp'
import './About.css'

function About() {
  // Expose the logo asset to CSS so .medallion can paint it, same as Landing.
  const pageStyle = { '--logo': `url(${logo})` }

  return (
    <div className="about-page" style={pageStyle}>
      {/* Header: brand hard-left, nav hard-right. About us is the current page. */}
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="medallion brand-mark" aria-hidden="true"></span>
          <span className="wordmark">Old <span className="gold">Is&nbsp;Gold</span></span>
        </Link>

        <nav className="main-nav" aria-label="Primary">
          <Link className="nav-pill" to="/aboutus" aria-current="page">About us</Link>
          <Link className="nav-pill" to="/login">Log in</Link>
        </nav>
      </header>

      <main>
        <section className="hero wrap">
          <p className="eyebrow">Our story</p>
          <h1 className="page-title">Why I built Old Is Gold</h1>
          <hr className="rule" />
        </section>

        <section className="story wrap">
          <p>For a long time I watched the fitness world chase one kind of person. Young, fast, already strong. Open almost any popular fitness app and you find tiny text, blaring music, timers counting down at you, and workouts that assume you can already drop and do fifty pushups. The people who have the most to gain from gentle, steady movement, our parents and our grandparents, were treated like an afterthought.</p>
          <p>That never felt right to me. Getting older does not mean you stop caring about how you feel. It means you have earned tools that actually fit your life. Larger buttons you can see and tap without squinting. Plain words instead of gym jargon. Workouts that respect your pace, your joints, and your good days and bad days. Encouragement, never pressure.</p>
          <p>So we made Old Is Gold for exactly that. It is <strong>strength, balance, and confidence built for ages 55 and up</strong>. No shame, no rush, no fine print. Just simple movement that meets you where you are, and grows with you from there.</p>
        </section>

        <section className="wrap">
          <div className="sec-head">
            <p className="eyebrow">What we stand for</p>
            <h2>What we believe</h2>
          </div>
          <div className="beliefs">
            <div className="belief">
              <span className="b-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20.5C6 20.5 3 16.5 3 11.5 3 6 8 3.5 16 3.5c1 0 4 0 4 0s.5 9-4 14c-1.7 1.9-3.5 3-5 3Z" /><path d="M11 20.5c0-5 2.5-8.5 7-11" /></svg>
              </span>
              <h3>Calm, not loud</h3>
              <p>Fitness should feel steady and welcoming, never like a competition.</p>
            </div>
            <div className="belief">
              <span className="b-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19v-5" /><path d="M12 19V8" /><path d="M19 19v-9" /><path d="M3.5 9.5 12 4l8.5 4" /></svg>
              </span>
              <h3>Strong at any age</h3>
              <p>Every body deserves to feel capable, no matter the number of birthdays.</p>
            </div>
            <div className="belief">
              <span className="b-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.8-9.5-9.6C1.1 7.4 3.2 4.5 6.3 4.5c2 0 3.4 1.1 4.2 2.5.8-1.4 2.2-2.5 4.2-2.5 3.1 0 5.2 2.9 3.8 6.4C16.5 15.7 12 20.5 12 20.5Z" /></svg>
              </span>
              <h3>Simple takes care</h3>
              <p>Making something this easy to use is not the lazy choice. It is the whole point.</p>
            </div>
          </div>
        </section>

        <section className="wrap">
          <div className="sec-head">
            <p className="eyebrow">What is next</p>
            <h2>We are just getting started</h2>
          </div>
          <div className="coming">
            <div className="csoon">
              <span className="pill"><span className="dot"></span>Coming soon</span>
              <span className="cs-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="10" height="10" rx="3" /><path d="M9.2 7l.7-3h4.2l.7 3" /><path d="M9.2 17l.7 3h4.2l.7-3" /><path d="M12 10.5v2l1.4 1" /></svg>
              </span>
              <h3>Connect your wearables</h3>
              <p>Soon you will be able to link the devices you already wear, like your Apple Watch or your WHOOP band. Your steps, heart rate, and sleep will flow straight into Old Is Gold, so you get a fuller picture of your health without typing in a single number.</p>
              <div className="badges">
                <span className="badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="10" height="10" rx="3" /><path d="M9.2 7l.7-3h4.2l.7 3" /><path d="M9.2 17l.7 3h4.2l.7-3" /></svg>Apple Watch</span>
                <span className="badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h3.5l1.8-4.5L11 16l2-7 1.6 3H21" /></svg>WHOOP</span>
              </div>
            </div>
            <div className="csoon">
              <span className="pill"><span className="dot"></span>Coming soon</span>
              <span className="cs-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="6.5" y="2.5" width="11" height="19" rx="3" /><path d="M10.5 18.5h3" /></svg>
              </span>
              <h3>An app in your pocket</h3>
              <p>We are building a mobile app so you can take your workouts anywhere, on the couch, in the park, or away visiting family. It will be available on both iPhone and Android devices.</p>
              <div className="badges">
                <span className="badge"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16 3.5c.1 1-.3 2-1 2.8-.7.8-1.7 1.3-2.6 1.2-.1-1 .4-2 1-2.7.7-.8 1.8-1.3 2.6-1.3ZM18.6 17c-.4 1-.6 1.4-1.1 2.3-.8 1.2-1.8 2.7-3.2 2.7-1.2 0-1.5-.8-3-.8s-1.9.8-3 .8c-1.4 0-2.4-1.3-3.1-2.5-2-3-2.2-6.6-1-8.5.9-1.4 2.3-2.2 3.6-2.2 1.4 0 2.2.8 3.3.8 1.1 0 1.7-.8 3.3-.8 1.1 0 2.3.6 3.2 1.7-2.8 1.5-2.4 5.5.7 6.5Z" /></svg>iPhone</span>
                <span className="badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9.5v6.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V9.5" /><path d="M5 9.5C5 6.5 8 4.5 12 4.5s7 2 7 5" /><path d="M8.5 7 7 4.8M15.5 7 17 4.8M9 12h.01M15 12h.01" /></svg>Android</span>
              </div>
            </div>
          </div>

          <p className="closing">We will let you know the moment each of these is ready. Thank you for being here at the beginning.</p>
        </section>
      </main>

      <footer>
        <p className="fmark">Old <span className="gold">Is Gold</span>. Strength and balance for every stage of life.</p>
      </footer>
    </div>
  )
}

export default About
