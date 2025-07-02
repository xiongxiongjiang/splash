# Seed
## local setup
- replace with local SPB
- clean up docker-compose, load everything from .env.local. cleanup code


## Things to cover
- schema
- endpoitns
- how to build loop DAG
- Chat architechture
  - option 1. 
  - option 2
- [todo] how to manage memory 


## Main task
- [x] after resume upload, i should be able to ask my chat agent about my current profile
- [x] implment endpoitns below as fake
- implmeent loop DAG keep calling identify dags as fake to show

- implement parse_job_posting and reimplement the real DAG
- implement completeness flow for Profile 
   - this needs to first happen in resume
   - then maybe expose a tool to agent


## Endpoints
[scheams](./docs/database-schema.md)
# API design (everything automatically becomes MCP)
- [non-mcp] Basic CRUD operations on each table if needed
   - update_resume(patch)
   - update_profile(patch)
- [exits] parse_resume(user, file) -> profile, resume  
- parse_job_posting(user, file)-> job_posting
- identify_profile_gaps(user) -> show gaps
- identify_gaps_per_job(job,user) -> show gaps
- generate_resume(job, user)
   - validate (no gaps)
- generate_referral(job, user, referer)
   - validate (no gaps )
- get_context(user[optoinal], job[optional]) -> memory, static data 


## Open Questions
- @Justin How to handle 我确实搞不定这个gap，Tally应该怎么处理. 不匹配的简历如何解决
   - what's the short-term solution 
      - [justin] add to WP group 
      - [Justin] buff up the resume? 
      - [seed] record the gap authentically? 
- completeness vs gaplessness 
   - how to track this
   - encourage them to grow 